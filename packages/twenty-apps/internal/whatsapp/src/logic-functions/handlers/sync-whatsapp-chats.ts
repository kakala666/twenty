import { type WahaSession } from 'src/connector/types/waha-api.type';
import { WahaClient } from 'src/connector/waha-client';
import {
  createWhatsappChat,
  findWhatsappChatByAddresses,
  updateWhatsappChat,
  upsertWhatsappAccount,
  type WhatsappAccountRecord,
} from 'src/records/whatsapp-record-client';
import {
  buildWhatsappLidIndex,
  findWhatsappLidMapping,
  type WhatsappLidIndex,
} from 'src/utils/build-whatsapp-lid-index.util';
import { isWhatsappGroupChatId } from 'src/utils/is-whatsapp-group-chat-id.util';
import { mapWahaSessionStatus } from 'src/utils/map-waha-session-status.util';
import { parseWhatsappJid } from 'src/utils/parse-whatsapp-jid.util';
import { resolveWhatsappIdentity } from 'src/utils/resolve-whatsapp-identity.util';
import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';

// One page is enough for the recurring sync: chats come back most-recent first,
// and anything older is reached through the (separate) history backfill.
const CHATS_OVERVIEW_LIMIT = 100;
// The lid table is small (one row per known peer) and is fetched once per run.
const LID_MAPPINGS_LIMIT = 1000;

export type SyncWhatsappChatsResult = {
  success: boolean;
  syncedAccountCount: number;
  syncedChatCount: number;
  message: string;
};

const syncAccount = async (
  session: WahaSession,
  syncedAt: string,
): Promise<WhatsappAccountRecord> => {
  const me = session.me ?? {};
  const phoneJid = isNonEmptyString(me.id) ? me.id : null;

  return await upsertWhatsappAccount({
    sessionName: session.name,
    displayName: isNonEmptyString(me.pushName) ? me.pushName : session.name,
    // `me.id` is the phone JID; the bare number is what a human recognises.
    phoneNumber: isDefined(phoneJid) ? parseWhatsappJid(phoneJid).user : null,
    lid: isNonEmptyString(me.lid) ? me.lid : null,
    status: mapWahaSessionStatus(session.status),
    lastSyncedAt: syncedAt,
  });
};

// Best effort: without the lid table chats still sync, they just carry one
// address instead of two, so a failure here must not abort the run.
const loadLidIndex = async (
  client: WahaClient,
  sessionName: string,
): Promise<WhatsappLidIndex> => {
  try {
    return buildWhatsappLidIndex(
      await client.listLidMappings({ sessionName, limit: LID_MAPPINGS_LIMIT }),
    );
  } catch (error) {
    console.warn(
      `[whatsapp] Could not load the lid table for session ${sessionName}:`,
      error,
    );

    return buildWhatsappLidIndex([]);
  }
};

const syncChatsForSession = async ({
  client,
  session,
  account,
  lidIndex,
}: {
  client: WahaClient;
  session: WahaSession;
  account: WhatsappAccountRecord;
  lidIndex: WhatsappLidIndex;
}): Promise<number> => {
  const chats = await client.getChatsOverview({
    sessionName: session.name,
    limit: CHATS_OVERVIEW_LIMIT,
  });

  let syncedChatCount = 0;

  for (const chat of chats) {
    if (!isNonEmptyString(chat?.id)) {
      continue;
    }

    // Overviews are keyed by `@c.us` while messages carry `@lid`, so both
    // addresses are stored to keep the two streams joinable.
    const identity = resolveWhatsappIdentity({
      observedJid: chat.id,
      lidToPhoneJid: findWhatsappLidMapping(lidIndex, chat.id),
    });

    if (!isDefined(identity)) {
      continue;
    }

    const lastMessageTimestampInSeconds = chat.lastMessage?.timestamp;
    const lastMessageAt =
      typeof lastMessageTimestampInSeconds === 'number'
        ? new Date(lastMessageTimestampInSeconds * 1000).toISOString()
        : null;

    const chatInput = {
      chatId: identity.currentChatId,
      phoneJid: identity.phoneJid,
      lid: identity.lid,
      // WAHA exposes no isGroup flag: the `@g.us` server is the only signal.
      isGroup: isWhatsappGroupChatId(identity.currentChatId),
      lastMessageAt,
      accountId: account.id,
    };

    const existingChat = await findWhatsappChatByAddresses(identity.knownIds);

    if (isDefined(existingChat)) {
      // `name` is deliberately absent from the update: it is the one field a
      // human is allowed to correct, and rewriting it every 15 minutes would
      // silently undo that edit. WhatsApp-side renames therefore do not
      // propagate to an existing chat, which is the trade we want.
      await updateWhatsappChat(existingChat.id, chatInput);
    } else {
      await createWhatsappChat({
        ...chatInput,
        name: isNonEmptyString(chat.name) ? chat.name : identity.currentChatId,
      });
    }

    syncedChatCount += 1;
  }

  return syncedChatCount;
};

// Accounts and chats only. Message history is deliberately out of scope here:
// importing it needs time-window slicing, which belongs to its own job.
export const syncWhatsappChats =
  async (): Promise<SyncWhatsappChatsResult> => {
    const client = WahaClient.fromApplicationVariables();
    const syncedAt = new Date().toISOString();
    const sessions = await client.listSessions();

    let syncedAccountCount = 0;
    let syncedChatCount = 0;

    for (const session of sessions) {
      if (!isNonEmptyString(session?.name)) {
        continue;
      }

      const account = await syncAccount(session, syncedAt);

      syncedAccountCount += 1;

      const lidIndex = await loadLidIndex(client, session.name);

      syncedChatCount += await syncChatsForSession({
        client,
        session,
        account,
        lidIndex,
      });
    }

    return {
      success: true,
      syncedAccountCount,
      syncedChatCount,
      message: `Synced ${syncedAccountCount} account(s) and ${syncedChatCount} chat(s).`,
    };
  };
