import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  type WhatsappAckStatus,
  type WhatsappMessageDirection,
} from '@/whatsapp/types/WhatsappAckStatus';

// Hand-written: app-defined custom objects have no generated GraphQL types.
export type WhatsappMessageRecord = ObjectRecord & {
  id: string;
  externalId: string;
  waMessageId: string;
  text: string | null;
  sentAt: string;
  direction: WhatsappMessageDirection;
  ackStatus: WhatsappAckStatus | null;
  senderId: string | null;
  senderName: string | null;
  replyToExternalId: string | null;
  hasMedia: boolean;
  mediaMimeType: string | null;
  // The join column of the MANY_TO_ONE `whatsappChat` relation: a Twenty record
  // UUID, not the WhatsApp chat id string.
  whatsappChatId: string;
};
