import { type WahaMessage } from 'src/connector/types/waha-api.type';
import { WahaClient } from 'src/connector/waha-client';
import {
  createWhatsappMessage,
  findWhatsappChatById,
  findWhatsappChatsNeedingBackfill,
  findWhatsappMessagesByExternalIds,
  updateWhatsappChat,
  type WhatsappChatRecord,
} from 'src/records/whatsapp-record-client';
import {
  advanceWhatsappBackfillWatermark,
  type WhatsappBackfillWindowResult,
} from 'src/utils/advance-whatsapp-backfill-watermark.util';
import { buildWahaHistoryEvent } from 'src/utils/build-waha-history-event.util';
import { computeWhatsappBackfillWindows } from 'src/utils/compute-whatsapp-backfill-windows.util';
import { extractWahaSenderName } from 'src/utils/extract-waha-sender-name.util';
import { parseWahaMessageEvent } from 'src/utils/parse-waha-message-event.util';
import { resolveWhatsappBackfillOptions } from 'src/utils/resolve-whatsapp-backfill-options.util';
import { type WhatsappBackfillWindow } from 'src/utils/types/whatsapp-backfill-window.type';
import { type WhatsappInboundMessage } from 'src/utils/types/whatsapp-inbound-message.type';
import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';
import {
  isWhatsappBackfillBudgetExhausted,
  type WhatsappBackfillBudget,
  type WhatsappBackfillSpend,
} from 'src/utils/whatsapp-backfill-run-budget.util';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

// A week per window. Small enough that an interrupted window is cheap to
// re-fetch, large enough that ninety days of a normal chat is a dozen windows
// rather than a hundred.
const BACKFILL_WINDOW_SIZE_IN_MS = 7 * ONE_DAY_IN_MS;

// WAHA caps `limit` at 100 on the messages endpoint.
const MESSAGES_PAGE_SIZE = 100;

// Runaway guard, not a budget: thirty pages is three thousand messages inside a
// single week of a single chat. Hitting it leaves the window incomplete, so the
// watermark does not move and the run reports the chat as unfinished.
const MAX_PAGES_PER_WINDOW = 30;

export type BackfillWhatsappMessagesResult = {
  success: boolean;
  chatsProcessed: number;
  windowsFetched: number;
  messagesCreated: number;
  messagesAlreadyPresent: number;
  messagesSkipped: number;
  errors: string[];
  // Oldest instant any chat's watermark reached in this run, ISO-8601.
  oldestReachedAt: string | null;
  // False when the run budget stopped the work early; the next run continues.
  isComplete: boolean;
  message: string;
};

type BackfillCounters = {
  windowsFetched: number;
  messagesFetched: number;
  messagesCreated: number;
  messagesAlreadyPresent: number;
  messagesSkipped: number;
};

const createCounters = (): BackfillCounters => ({
  windowsFetched: 0,
  messagesFetched: 0,
  messagesCreated: 0,
  messagesAlreadyPresent: 0,
  messagesSkipped: 0,
});

const toSpend = (counters: BackfillCounters): WhatsappBackfillSpend => ({
  windowsFetched: counters.windowsFetched,
  messagesFetched: counters.messagesFetched,
});

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

// Chats are keyed by `@c.us` on WAHA's side; the other addresses are only ever
// fallbacks for a chat first seen through a message event.
const resolveWahaChatId = (chat: WhatsappChatRecord): string | null => {
  for (const address of [chat.chatId, chat.phoneJid, chat.lid]) {
    if (isNonEmptyString(address)) {
      return address;
    }
  }

  return null;
};

const readSyncedFromAt = (chat: WhatsappChatRecord): Date | null => {
  if (!isNonEmptyString(chat.syncedFromAt)) {
    return null;
  }

  const syncedFromAt = new Date(chat.syncedFromAt);

  return Number.isNaN(syncedFromAt.getTime()) ? null : syncedFromAt;
};

const storeHistoryPage = async ({
  rawMessages,
  sessionName,
  whatsappChatId,
  counters,
}: {
  rawMessages: readonly WahaMessage[];
  sessionName: string;
  whatsappChatId: string;
  counters: BackfillCounters;
}): Promise<void> => {
  const events: {
    event: Record<string, unknown>;
    message: WhatsappInboundMessage;
  }[] = [];

  for (const rawMessage of rawMessages) {
    const event = buildWahaHistoryEvent({ message: rawMessage, sessionName });

    if (!isDefined(event)) {
      counters.messagesSkipped += 1;
      continue;
    }

    const message = parseWahaMessageEvent(event);

    if (!isNonEmptyString(message.externalId)) {
      counters.messagesSkipped += 1;
      continue;
    }

    events.push({ event, message });
  }

  // The same externalId check the webhook runs, batched one page at a time: a
  // message already imported is a no-op, never an error and never counted new.
  const alreadyStoredExternalIds = new Set(
    (
      await findWhatsappMessagesByExternalIds(
        events.map(({ message }) => message.externalId),
      )
    )
      .map((record) => record.externalId)
      .filter(isNonEmptyString),
  );

  for (const { event, message } of events) {
    if (alreadyStoredExternalIds.has(message.externalId)) {
      counters.messagesAlreadyPresent += 1;
      continue;
    }

    const stored = await createWhatsappMessage({
      externalId: message.externalId,
      waMessageId: message.waMessageId,
      text: message.text,
      sentAt: message.sentAt.toISOString(),
      direction: message.fromMe ? 'OUTBOUND' : 'INBOUND',
      // Whatever ack the server still holds for an old message, commonly none.
      ackStatus: message.ackStatus,
      senderId: message.senderId,
      senderName: extractWahaSenderName(event),
      replyToExternalId: message.replyToExternalId,
      // Set from the payload descriptor only; media bytes are never downloaded
      // during backfill.
      hasMedia: message.hasMedia,
      mediaMimeType: message.mediaMimeType,
      rawPayload: event.payload,
      whatsappChatId,
    });

    if (stored.wasCreated) {
      counters.messagesCreated += 1;
    } else {
      // A concurrent webhook delivery won the race; still not a new message.
      counters.messagesAlreadyPresent += 1;
    }
  }
};

// Pages one window to its end. Offset paging is safe here even though it is not
// safe over a whole chat: the window is a closed interval that ends no later
// than the run anchor, so a message arriving mid-run falls outside the filter
// and cannot shift the offsets underneath us.
const importWindow = async ({
  client,
  sessionName,
  wahaChatId,
  whatsappChatId,
  window,
  counters,
}: {
  client: WahaClient;
  sessionName: string;
  wahaChatId: string;
  whatsappChatId: string;
  window: WhatsappBackfillWindow;
  counters: BackfillCounters;
}): Promise<boolean> => {
  for (let page = 0; page < MAX_PAGES_PER_WINDOW; page++) {
    const rawMessages = await client.getChatMessages({
      sessionName,
      chatId: wahaChatId,
      limit: MESSAGES_PAGE_SIZE,
      offset: page * MESSAGES_PAGE_SIZE,
      gteInSeconds: window.gteInSeconds,
      lteInSeconds: window.lteInSeconds,
    });

    counters.messagesFetched += rawMessages.length;

    await storeHistoryPage({
      rawMessages,
      sessionName,
      whatsappChatId,
      counters,
    });

    // A short page is the only end-of-data signal WAHA offers: the endpoint
    // returns a bare array with no total and no cursor.
    if (rawMessages.length < MESSAGES_PAGE_SIZE) {
      return true;
    }
  }

  return false;
};

const backfillChat = async ({
  client,
  chat,
  runAnchoredAt,
  horizonAt,
  budget,
  counters,
}: {
  client: WahaClient;
  chat: WhatsappChatRecord;
  runAnchoredAt: Date;
  horizonAt: Date;
  budget: WhatsappBackfillBudget;
  counters: BackfillCounters;
}): Promise<Date | null> => {
  const wahaChatId = resolveWahaChatId(chat);

  if (!isDefined(wahaChatId)) {
    throw new Error(`Chat ${chat.id} carries no WhatsApp address.`);
  }

  const currentSyncedFromAt = readSyncedFromAt(chat);
  const windows = computeWhatsappBackfillWindows({
    oldestAt: horizonAt,
    // Anchored once for the whole run, never Date.now() inside the loop, so a
    // retry recomputes an identical plan.
    newestAt: runAnchoredAt,
    syncedFromAt: currentSyncedFromAt,
    windowSizeInMs: BACKFILL_WINDOW_SIZE_IN_MS,
  });

  const sessionName = isNonEmptyString(chat.accountSessionName)
    ? chat.accountSessionName
    : WahaClient.getConfiguredSessionName();

  const windowResults: WhatsappBackfillWindowResult[] = [];
  let failure: unknown = null;

  for (const window of windows) {
    if (isWhatsappBackfillBudgetExhausted(budget, toSpend(counters))) {
      break;
    }

    counters.windowsFetched += 1;

    let isComplete = false;

    try {
      isComplete = await importWindow({
        client,
        sessionName,
        wahaChatId,
        whatsappChatId: chat.id,
        window,
        counters,
      });
    } catch (error) {
      failure = error;
    }

    windowResults.push({ window, isComplete });

    // An unfinished window is where the watermark stops. Older windows are
    // abandoned too: crossing them would strand the hole this one left.
    if (!isComplete) {
      break;
    }
  }

  const nextSyncedFromAt = advanceWhatsappBackfillWatermark({
    currentSyncedFromAt,
    windowResults,
  });

  if (isDefined(nextSyncedFromAt)) {
    await updateWhatsappChat(chat.id, {
      syncedFromAt: nextSyncedFromAt.toISOString(),
    });
  }

  if (isDefined(failure)) {
    throw failure;
  }

  return nextSyncedFromAt;
};

const loadChatsToBackfill = async ({
  chatId,
  horizonAt,
  maxChatsPerRun,
}: {
  chatId: string | null;
  horizonAt: Date;
  maxChatsPerRun: number;
}): Promise<WhatsappChatRecord[]> => {
  if (!isDefined(chatId)) {
    return await findWhatsappChatsNeedingBackfill({
      backfillHorizonAt: horizonAt.toISOString(),
      first: maxChatsPerRun,
    });
  }

  const chat = await findWhatsappChatById(chatId);

  if (!isDefined(chat)) {
    throw new Error(`No whatsappChat record with id ${chatId}.`);
  }

  return [chat];
};

// Imports WhatsApp history that predates this app's install. Runs on a cron and
// on demand: `dev:function:exec -n whatsapp-backfill-messages -p '{"chatId":
// "<uuid>","horizonDays":365}'`. Every option is optional, see
// resolve-whatsapp-backfill-options.util for the defaults.
export const backfillWhatsappMessages = async (
  payload?: unknown,
): Promise<BackfillWhatsappMessagesResult> => {
  const options = resolveWhatsappBackfillOptions(payload);
  const runAnchoredAt = new Date();
  const horizonAt = new Date(
    runAnchoredAt.getTime() - options.horizonDays * ONE_DAY_IN_MS,
  );
  const budget: WhatsappBackfillBudget = {
    maxWindows: options.maxWindowsPerRun,
    maxMessages: options.maxMessagesPerRun,
  };

  const counters = createCounters();
  const errors: string[] = [];
  let chatsProcessed = 0;
  let oldestReachedInMs: number | null = null;

  const client = WahaClient.fromApplicationVariables();

  let chats: WhatsappChatRecord[] = [];

  try {
    chats = await loadChatsToBackfill({
      chatId: options.chatId,
      horizonAt,
      maxChatsPerRun: options.maxChatsPerRun,
    });
  } catch (error) {
    // A mistyped chatId on an on-demand run reads better as a summary than as a
    // stack trace, and the cron's own failure mode is the same shape.
    console.error('[whatsapp] Could not list the chats to backfill:', error);
    errors.push(describeError(error));
  }

  for (const chat of chats) {
    if (isWhatsappBackfillBudgetExhausted(budget, toSpend(counters))) {
      break;
    }

    chatsProcessed += 1;

    try {
      const reachedAt = await backfillChat({
        client,
        chat,
        runAnchoredAt,
        horizonAt,
        budget,
        counters,
      });

      if (isDefined(reachedAt)) {
        const reachedInMs = reachedAt.getTime();

        oldestReachedInMs =
          oldestReachedInMs === null
            ? reachedInMs
            : Math.min(oldestReachedInMs, reachedInMs);
      }
    } catch (error) {
      // One unreachable chat must not cost the run every other chat's progress.
      console.error(`[whatsapp] Backfill failed for chat ${chat.id}:`, error);
      errors.push(`Chat ${chat.id}: ${describeError(error)}`);
    }
  }

  const isComplete = !isWhatsappBackfillBudgetExhausted(
    budget,
    toSpend(counters),
  );

  return {
    success: errors.length === 0,
    chatsProcessed,
    windowsFetched: counters.windowsFetched,
    messagesCreated: counters.messagesCreated,
    messagesAlreadyPresent: counters.messagesAlreadyPresent,
    messagesSkipped: counters.messagesSkipped,
    errors,
    oldestReachedAt: isDefined(oldestReachedInMs)
      ? new Date(oldestReachedInMs).toISOString()
      : null,
    isComplete,
    message: `Backfilled ${chatsProcessed} chat(s) over ${counters.windowsFetched} window(s): ${counters.messagesCreated} new, ${counters.messagesAlreadyPresent} already present, ${counters.messagesSkipped} skipped, ${errors.length} error(s).${isComplete ? '' : ' Run budget exhausted; the next run continues.'}`,
  };
};
