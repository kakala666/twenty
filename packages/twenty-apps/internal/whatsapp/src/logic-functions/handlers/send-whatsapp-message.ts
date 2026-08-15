import { type WahaMessage } from 'src/connector/types/waha-api.type';
import { WahaClient } from 'src/connector/waha-client';
import {
  createWhatsappChat,
  createWhatsappMessage,
  findFirstWhatsappAccount,
  findWhatsappChatByAddresses,
  updateWhatsappChat,
  type WhatsappChatRecord,
} from 'src/records/whatsapp-record-client';
import { toWhatsappAckStatus } from 'src/utils/advance-whatsapp-ack-status.util';
import { isWhatsappGroupChatId } from 'src/utils/is-whatsapp-group-chat-id.util';
import { extractWaMessageId } from 'src/utils/parse-waha-message-event.util';
import { resolveWhatsappIdentity } from 'src/utils/resolve-whatsapp-identity.util';
import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';

export type SendWhatsappMessageInput = {
  chatId: string;
  text: string;
  // Composite external id of the message being answered, when this is a reply.
  replyToExternalId?: string;
};

export type SendWhatsappMessageResult = {
  success: boolean;
  message: string;
  // Suggested HTTP status; only read on failure.
  status?: number;
  externalId?: string;
  whatsappMessageId?: string;
};

// The session to send through is the one the chat already belongs to; a chat we
// have never seen falls back to the only connected account, and then to the
// configured session name so sending works before the first sync run.
const resolveSessionName = async (
  chat: WhatsappChatRecord | null,
): Promise<string> => {
  if (isNonEmptyString(chat?.accountSessionName)) {
    return chat.accountSessionName;
  }

  const account = await findFirstWhatsappAccount();

  if (isNonEmptyString(account?.sessionName)) {
    return account.sessionName;
  }

  return WahaClient.getConfiguredSessionName();
};

export const sendWhatsappMessage = async (
  input: SendWhatsappMessageInput,
): Promise<SendWhatsappMessageResult> => {
  if (!isNonEmptyString(input.chatId) || !isNonEmptyString(input.text)) {
    return {
      success: false,
      status: 400,
      message: 'Both chatId and text are required.',
    };
  }

  const identity = resolveWhatsappIdentity({ observedJid: input.chatId });

  if (!isDefined(identity)) {
    return {
      success: false,
      status: 400,
      message: `chatId "${input.chatId}" is not a valid WhatsApp address.`,
    };
  }

  const existingChat = await findWhatsappChatByAddresses(identity.knownIds);
  const sessionName = await resolveSessionName(existingChat);

  let sentMessage: WahaMessage;

  try {
    sentMessage = await WahaClient.fromApplicationVariables().sendText({
      sessionName,
      chatId: input.chatId,
      text: input.text,
      ...(isNonEmptyString(input.replyToExternalId)
        ? { replyToMessageId: input.replyToExternalId }
        : {}),
    });
  } catch (error) {
    // Nothing was stored, so the caller can safely retry the same request.
    console.error('[whatsapp] WAHA rejected the outbound message:', error);

    return {
      success: false,
      status: 502,
      message: `WAHA could not send the message through session "${sessionName}".`,
    };
  }

  const externalId = sentMessage.id;

  if (!isNonEmptyString(externalId)) {
    return {
      success: false,
      status: 502,
      message: 'WAHA accepted the message but returned no message id.',
    };
  }

  const sentAt = new Date(
    // WAHA reports message timestamps in unix SECONDS.
    (sentMessage.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
  ).toISOString();

  const chat =
    existingChat ??
    (await createWhatsappChat({
      chatId: identity.currentChatId,
      name: identity.currentChatId,
      phoneJid: identity.phoneJid,
      lid: identity.lid,
      isGroup: isWhatsappGroupChatId(identity.currentChatId),
      lastMessageAt: sentAt,
    }));

  if (isDefined(existingChat)) {
    await updateWhatsappChat(existingChat.id, { lastMessageAt: sentAt });
  }

  // Store the message now so the UI shows it immediately; the webhook echo that
  // follows is deduped on externalId.
  const stored = await createWhatsappMessage({
    externalId,
    waMessageId: extractWaMessageId(externalId),
    text: input.text,
    sentAt,
    direction: 'OUTBOUND',
    ackStatus: toWhatsappAckStatus(sentMessage.ackName, sentMessage.ack),
    senderId: null,
    senderName: null,
    replyToExternalId: input.replyToExternalId ?? null,
    hasMedia: sentMessage.hasMedia ?? false,
    mediaMimeType: null,
    rawPayload: sentMessage,
    whatsappChatId: chat.id,
  });

  return {
    success: true,
    message: stored.wasCreated
      ? `Message sent to ${input.chatId}.`
      : `Message sent to ${input.chatId}; the webhook echo had already stored it.`,
    externalId,
    whatsappMessageId: stored.id,
  };
};
