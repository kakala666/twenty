import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { WHATSAPP_CHAT_OBJECT_NAME_SINGULAR } from '@/whatsapp/constants/WhatsappChatObjectNameSingular';
import { WHATSAPP_CHATS_PAGE_SIZE } from '@/whatsapp/constants/WhatsappChatsPageSize';
import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';

const WHATSAPP_CHAT_GQL_FIELDS = {
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
};

export const useWhatsappChats = () => {
  const {
    records,
    loading,
    hasNextPage,
    fetchMoreRecords,
    refetch,
    objectMetadataItem,
  } = useFindManyRecords<WhatsappChatRecord>({
    objectNameSingular: WHATSAPP_CHAT_OBJECT_NAME_SINGULAR,
    orderBy: [{ lastMessageAt: 'DescNullsLast' }],
    limit: WHATSAPP_CHATS_PAGE_SIZE,
    recordGqlFields: WHATSAPP_CHAT_GQL_FIELDS,
  });

  return {
    whatsappChats: records,
    whatsappChatObjectMetadataItem: objectMetadataItem,
    loading,
    hasMoreWhatsappChats: hasNextPage,
    fetchMoreWhatsappChats: fetchMoreRecords,
    refetchWhatsappChats: refetch,
  };
};
