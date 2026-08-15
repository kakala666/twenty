import {
  type WhatsappAckStatus,
  type WhatsappInboundMessage,
} from 'src/utils/types/whatsapp-inbound-message.type';
import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';

// WAHA composite message id: `<fromMe>_<chatId>_<waMessageId>` and, in groups,
// a fourth `<participant>` segment. The chat id itself contains no underscore.
export const extractWaMessageId = (externalId: string): string => {
  const segments = externalId.split('_');

  return segments[2] ?? externalId;
};

type WahaMediaDescriptor = {
  mimetype?: string;
};

type WahaRawMessage = {
  extendedTextMessage?: {
    contextInfo?: {
      stanzaID?: string;
    };
  };
} & Partial<Record<WahaMediaDescriptorKey, WahaMediaDescriptor>>;

// Raw GOWS descriptor keys, in the order WhatsApp itself would nest them. Only
// one of them is ever present on a given message.
const WAHA_MEDIA_DESCRIPTOR_KEYS = [
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'documentMessage',
  'stickerMessage',
] as const;

type WahaMediaDescriptorKey = (typeof WAHA_MEDIA_DESCRIPTOR_KEYS)[number];

// `media` is only populated when the caller asked for `downloadMedia=true`, so
// the raw descriptor is the reliable source for the mime type.
const extractMediaMimeType = (
  payload: Record<string, unknown>,
): string | null => {
  const media = payload.media as WahaMediaDescriptor | null | undefined;

  if (isDefined(media?.mimetype)) {
    return media.mimetype;
  }

  const rawData = payload._data as { Message?: WahaRawMessage } | undefined;
  const rawMessage = rawData?.Message;

  if (!isDefined(rawMessage)) {
    return null;
  }

  for (const descriptorKey of WAHA_MEDIA_DESCRIPTOR_KEYS) {
    const mimetype = rawMessage[descriptorKey]?.mimetype;

    if (isDefined(mimetype)) {
      return mimetype;
    }
  }

  return null;
};

// `replyTo` is the documented location, but under GOWS it is frequently null
// while the quoted-message id still sits in the raw protobuf contextInfo.
const extractReplyToExternalId = (
  payload: Record<string, unknown>,
): string | null => {
  const replyTo = payload.replyTo as { id?: string } | null | undefined;

  if (isDefined(replyTo?.id)) {
    return replyTo.id;
  }

  const rawData = payload._data as { Message?: WahaRawMessage } | undefined;
  const stanzaId = rawData?.Message?.extendedTextMessage?.contextInfo?.stanzaID;

  return isDefined(stanzaId) ? stanzaId : null;
};

export const parseWahaMessageEvent = (
  event: Record<string, unknown>,
): WhatsappInboundMessage => {
  const payload = event.payload as Record<string, unknown>;
  const externalId = payload.id as string;
  const chatId = payload.from as string;
  // In a group `from` is the `@g.us` chat and `participant` is the real author.
  const participant = payload.participant as string | null;

  return {
    externalId,
    waMessageId: extractWaMessageId(externalId),
    sessionName: event.session as string,
    chatId,
    senderId: isDefined(participant) ? participant : chatId,
    fromMe: payload.fromMe as boolean,
    // Media-only messages arrive with an empty string rather than null.
    text: isNonEmptyString(payload.body) ? payload.body : null,
    // payload.timestamp is unix SECONDS while the envelope timestamp is millis.
    sentAt: new Date((payload.timestamp as number) * 1000),
    ackStatus: (payload.ackName as WhatsappAckStatus | null) ?? 'UNKNOWN',
    replyToExternalId: extractReplyToExternalId(payload),
    hasMedia: (payload.hasMedia as boolean | undefined) ?? false,
    mediaMimeType: extractMediaMimeType(payload),
  };
};
