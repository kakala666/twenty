import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

type WhatsappChatLinkedPerson = {
  id: string;
  name: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  avatarUrl: string | null;
};

type WhatsappChatLinkedCompany = {
  id: string;
  name: string | null;
};

// Hand-written: app-defined custom objects have no generated GraphQL types.
export type WhatsappChatRecord = ObjectRecord & {
  id: string;
  // The WhatsApp chat id string (e.g. `8619880607709@c.us`) expected by the
  // send API — distinct from `id`, which is the Twenty record UUID.
  chatId: string;
  name: string | null;
  phoneJid: string | null;
  isGroup: boolean;
  lastMessageAt: string | null;
  accountId: string | null;
  personId: string | null;
  companyId: string | null;
  person: WhatsappChatLinkedPerson | null;
  company: WhatsappChatLinkedCompany | null;
};
