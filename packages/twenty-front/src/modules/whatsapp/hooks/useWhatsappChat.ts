import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { WHATSAPP_CHAT_OBJECT_NAME_SINGULAR } from '@/whatsapp/constants/WhatsappChatObjectNameSingular';
import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';
import { isDefined } from 'twenty-shared/utils';

// Fetched on its own rather than picked out of the list so a deep link to a
// conversation beyond the first page still renders its header and can send.
export const useWhatsappChat = (whatsappChatRecordId: string | undefined) => {
  const { record, loading } = useFindOneRecord<WhatsappChatRecord>({
    objectNameSingular: WHATSAPP_CHAT_OBJECT_NAME_SINGULAR,
    objectRecordId: whatsappChatRecordId,
    skip: !isDefined(whatsappChatRecordId),
    recordGqlFields: {
      id: true,
      chatId: true,
      name: true,
      phoneJid: true,
      isGroup: true,
      lastMessageAt: true,
      accountId: true,
      personId: true,
      companyId: true,
      person: {
        id: true,
        name: { firstName: true, lastName: true },
        avatarUrl: true,
      },
      company: { id: true, name: true },
    },
  });

  return {
    whatsappChat: record,
    loading,
  };
};
