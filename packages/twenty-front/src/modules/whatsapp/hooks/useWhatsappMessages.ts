import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { WHATSAPP_MESSAGE_OBJECT_NAME_SINGULAR } from '@/whatsapp/constants/WhatsappMessageObjectNameSingular';
import { WHATSAPP_MESSAGES_PAGE_SIZE } from '@/whatsapp/constants/WhatsappMessagesPageSize';
import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';

const WHATSAPP_MESSAGE_GQL_FIELDS = {
  id: true,
  externalId: true,
  waMessageId: true,
  text: true,
  sentAt: true,
  direction: true,
  ackStatus: true,
  senderId: true,
  senderName: true,
  replyToExternalId: true,
  hasMedia: true,
  mediaMimeType: true,
  whatsappChatId: true,
};

// Queried newest-first so cursor pagination walks backwards into history, then
// reversed once for rendering, which puts the oldest message at the top.
export const useWhatsappMessages = (
  whatsappChatRecordId: string | undefined,
) => {
  const { records, loading, hasNextPage, fetchMoreRecords, refetch } =
    useFindManyRecords<WhatsappMessageRecord>({
      objectNameSingular: WHATSAPP_MESSAGE_OBJECT_NAME_SINGULAR,
      filter: { whatsappChatId: { eq: whatsappChatRecordId ?? '' } },
      orderBy: [{ sentAt: 'DescNullsLast' }],
      limit: WHATSAPP_MESSAGES_PAGE_SIZE,
      skip: !isDefined(whatsappChatRecordId),
      recordGqlFields: WHATSAPP_MESSAGE_GQL_FIELDS,
    });

  const whatsappMessagesOldestFirst = useMemo(
    () => [...records].reverse(),
    [records],
  );

  return {
    whatsappMessagesOldestFirst,
    loading,
    hasOlderWhatsappMessages: hasNextPage,
    fetchMoreWhatsappMessages: fetchMoreRecords,
    refetchWhatsappMessages: refetch,
  };
};
