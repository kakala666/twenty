import {
  createWhatsappChat,
  createWhatsappMessage,
  findWhatsappAccountBySessionName,
  findWhatsappChatByAddresses,
  findWhatsappMessagesByExternalIds,
  updateWhatsappChat,
  updateWhatsappMessageAckStatus,
  type WhatsappChatRecord,
} from 'src/records/whatsapp-record-client';
import {
  advanceWhatsappAckStatus,
  toWhatsappAckStatus,
} from 'src/utils/advance-whatsapp-ack-status.util';
import { extractWahaSenderName } from 'src/utils/extract-waha-sender-name.util';
import { isWhatsappGroupChatId } from 'src/utils/is-whatsapp-group-chat-id.util';
import { parseWahaMessageEvent } from 'src/utils/parse-waha-message-event.util';
import { resolveWhatsappIdentity } from 'src/utils/resolve-whatsapp-identity.util';
import { type WhatsappInboundMessage } from 'src/utils/types/whatsapp-inbound-message.type';
import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';

// `fromMe` messages emit `message.any` only, never `message`, so both must be
// handled — and both fire for inbound messages, which is why the externalId
// check below has to make a repeat delivery a no-op.
export const WAHA_MESSAGE_EVENTS = ['message', 'message.any'] as const;
export const WAHA_ACK_EVENT = 'message.ack';

export type HandleWahaWebhookEventResult = {
  handled: boolean;
  event: string;
  detail: string;
};

const resolveChatForMessage = async (
  message: WhatsappInboundMessage,
  nameOnCreate: string | null,
): Promise<WhatsappChatRecord | null> => {
  const identity = resolveWhatsappIdentity({ observedJid: message.chatId });

  // Status broadcasts and the `0@c.us` placeholder are not addressable chats.
  if (!isDefined(identity)) {
    return null;
  }

  const existingChat = await findWhatsappChatByAddresses(identity.knownIds);

  if (isDefined(existingChat)) {
    // Backfill the address the message arrived on when the chat was first seen
    // under its other identity.
    await updateWhatsappChat(existingChat.id, {
      lastMessageAt: message.sentAt.toISOString(),
      ...(isDefined(identity.lid) && !isNonEmptyString(existingChat.lid)
        ? { lid: identity.lid }
        : {}),
      ...(isDefined(identity.phoneJid) &&
      !isNonEmptyString(existingChat.phoneJid)
        ? { phoneJid: identity.phoneJid }
        : {}),
    });

    return existingChat;
  }

  const account = await findWhatsappAccountBySessionName(message.sessionName);

  return await createWhatsappChat({
    chatId: identity.currentChatId,
    // A message event carries at best the sender's push name; the chat-sync cron
    // replaces this with the real contact or group name on its next run.
    name: nameOnCreate ?? identity.currentChatId,
    phoneJid: identity.phoneJid,
    lid: identity.lid,
    isGroup: isWhatsappGroupChatId(identity.currentChatId),
    lastMessageAt: message.sentAt.toISOString(),
    accountId: account?.id ?? null,
  });
};

const handleMessageEvent = async (
  event: Record<string, unknown>,
): Promise<HandleWahaWebhookEventResult> => {
  const eventName = event.event as string;
  const message = parseWahaMessageEvent(event);

  if (!isNonEmptyString(message.externalId)) {
    return {
      handled: false,
      event: eventName,
      detail: 'Payload carried no message id.',
    };
  }

  // The unique index on externalId is the real idempotency guarantee; this check
  // turns a repeat delivery into a no-op instead of a failed mutation.
  const [alreadyStored] = await findWhatsappMessagesByExternalIds([
    message.externalId,
  ]);

  if (isDefined(alreadyStored)) {
    return {
      handled: true,
      event: eventName,
      detail: `Message ${message.externalId} already stored.`,
    };
  }

  const senderName = extractWahaSenderName(event);
  // Only an inbound push name names the chat; our own does not.
  const chat = await resolveChatForMessage(
    message,
    message.fromMe ? null : senderName,
  );

  if (!isDefined(chat)) {
    return {
      handled: false,
      event: eventName,
      detail: `Chat id ${message.chatId} is not addressable.`,
    };
  }

  const stored = await createWhatsappMessage({
    externalId: message.externalId,
    waMessageId: message.waMessageId,
    text: message.text,
    sentAt: message.sentAt.toISOString(),
    direction: message.fromMe ? 'OUTBOUND' : 'INBOUND',
    ackStatus: message.ackStatus,
    senderId: message.senderId,
    senderName,
    replyToExternalId: message.replyToExternalId,
    hasMedia: message.hasMedia,
    mediaMimeType: message.mediaMimeType,
    // The whole envelope, so a WhatsApp feature we do not model yet is never
    // lost and needs no schema change to recover.
    rawPayload: event,
    whatsappChatId: chat.id,
  });

  return {
    handled: true,
    event: eventName,
    detail: stored.wasCreated
      ? `Stored message ${message.externalId}.`
      : `Message ${message.externalId} was stored by a concurrent delivery.`,
  };
};

const handleAckEvent = async (
  event: Record<string, unknown>,
): Promise<HandleWahaWebhookEventResult> => {
  const eventName = event.event as string;
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  // `ids` is an ARRAY: one ack event can acknowledge several messages at once.
  const externalIds = (
    Array.isArray(payload.ids) ? payload.ids : [payload.id]
  ).filter(isNonEmptyString);

  if (externalIds.length === 0) {
    return {
      handled: false,
      event: eventName,
      detail: 'Ack event carried no message ids.',
    };
  }

  const incomingStatus = toWhatsappAckStatus(payload.ackName, payload.ack);
  const messages = await findWhatsappMessagesByExternalIds(externalIds);

  let advancedCount = 0;

  for (const message of messages) {
    const nextStatus = advanceWhatsappAckStatus(
      message.ackStatus,
      incomingStatus,
    );

    if (!isDefined(nextStatus) || nextStatus === message.ackStatus) {
      continue;
    }

    await updateWhatsappMessageAckStatus(message.id, nextStatus);
    advancedCount += 1;
  }

  return {
    handled: true,
    event: eventName,
    detail: `Advanced ${advancedCount}/${externalIds.length} message(s) to ${incomingStatus}.`,
  };
};

export const handleWahaWebhookEvent = async (
  event: Record<string, unknown>,
): Promise<HandleWahaWebhookEventResult> => {
  const eventName = isNonEmptyString(event.event) ? event.event : 'unknown';

  if ((WAHA_MESSAGE_EVENTS as readonly string[]).includes(eventName)) {
    return await handleMessageEvent(event);
  }

  if (eventName === WAHA_ACK_EVENT) {
    return await handleAckEvent(event);
  }

  return {
    handled: false,
    event: eventName,
    detail: 'Event type not handled by this app.',
  };
};
