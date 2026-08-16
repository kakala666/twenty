import { useMemo } from 'react';

import { useListenToObjectRecordOperationBrowserEvent } from '@/browser-event/hooks/useListenToObjectRecordOperationBrowserEvent';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useListenToEventsForQuery } from '@/sse-db-event/hooks/useListenToEventsForQuery';
import { WHATSAPP_MESSAGE_OBJECT_NAME_SINGULAR } from '@/whatsapp/constants/WhatsappMessageObjectNameSingular';

type WhatsappMessagesSSESubscribeEffectProps = {
  whatsappChatRecordId: string;
  onWhatsappMessagesChanged: () => void;
};

// `create-many` events carry no records at all, so every operation type is
// handled the same way: refetch, never read records off the event.
export const WhatsappMessagesSSESubscribeEffect = ({
  whatsappChatRecordId,
  onWhatsappMessagesChanged,
}: WhatsappMessagesSSESubscribeEffectProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: WHATSAPP_MESSAGE_OBJECT_NAME_SINGULAR,
  });

  const operationSignature = useMemo(
    () => ({
      objectNameSingular: WHATSAPP_MESSAGE_OBJECT_NAME_SINGULAR,
      variables: { filter: { whatsappChatId: { eq: whatsappChatRecordId } } },
    }),
    [whatsappChatRecordId],
  );

  useListenToEventsForQuery({
    queryId: `whatsapp-messages-${whatsappChatRecordId}`,
    operationSignature,
    onSseReconnected: onWhatsappMessagesChanged,
  });

  useListenToObjectRecordOperationBrowserEvent({
    objectMetadataItemId: objectMetadataItem.id,
    operationTypes: ['create-one', 'create-many', 'update-one', 'update-many'],
    onObjectRecordOperationBrowserEvent: onWhatsappMessagesChanged,
  });

  return null;
};
