import { useMemo } from 'react';

import { useListenToObjectRecordOperationBrowserEvent } from '@/browser-event/hooks/useListenToObjectRecordOperationBrowserEvent';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useListenToEventsForQuery } from '@/sse-db-event/hooks/useListenToEventsForQuery';
import { WHATSAPP_CHAT_OBJECT_NAME_SINGULAR } from '@/whatsapp/constants/WhatsappChatObjectNameSingular';

const WHATSAPP_CHATS_QUERY_ID = 'whatsapp-chats-list';

type WhatsappChatsSSESubscribeEffectProps = {
  onWhatsappChatsChanged: () => void;
};

// SSE cache writes are broadcast-free, so a subscribed query does not re-render
// on its own; the browser event is what tells us to refetch.
export const WhatsappChatsSSESubscribeEffect = ({
  onWhatsappChatsChanged,
}: WhatsappChatsSSESubscribeEffectProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: WHATSAPP_CHAT_OBJECT_NAME_SINGULAR,
  });

  // An empty filter matches every chat, which is what keeps `lastMessageAt`
  // reordering live for conversations that are not currently open.
  const operationSignature = useMemo(
    () => ({
      objectNameSingular: WHATSAPP_CHAT_OBJECT_NAME_SINGULAR,
      variables: { filter: {} },
    }),
    [],
  );

  useListenToEventsForQuery({
    queryId: WHATSAPP_CHATS_QUERY_ID,
    operationSignature,
    onSseReconnected: onWhatsappChatsChanged,
  });

  useListenToObjectRecordOperationBrowserEvent({
    objectMetadataItemId: objectMetadataItem.id,
    operationTypes: ['create-one', 'create-many', 'update-one', 'update-many'],
    onObjectRecordOperationBrowserEvent: onWhatsappChatsChanged,
  });

  return null;
};
