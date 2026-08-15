// Ack values observed on the live GOWS engine. `null` arrives on inbound
// messages, which WAHA surfaces as UNKNOWN.
export const WHATSAPP_ACK_STATUSES = [
  'ERROR',
  'UNKNOWN',
  'PENDING',
  'SERVER',
  'DEVICE',
  'READ',
  'PLAYED',
] as const;

export type WhatsappAckStatus = (typeof WHATSAPP_ACK_STATUSES)[number];

export type WhatsappInboundMessage = {
  // Full composite WAHA id, used as the idempotency key.
  externalId: string;
  // Middle segment of the composite id: the id WhatsApp itself assigned.
  waMessageId: string;
  sessionName: string;
  chatId: string;
  senderId: string;
  fromMe: boolean;
  text: string | null;
  sentAt: Date;
  ackStatus: WhatsappAckStatus;
  replyToExternalId: string | null;
  hasMedia: boolean;
  // Mime type of the attachment, if any. Available even when the binary itself
  // was not downloaded, because it is carried by the raw media descriptor.
  mediaMimeType: string | null;
};
