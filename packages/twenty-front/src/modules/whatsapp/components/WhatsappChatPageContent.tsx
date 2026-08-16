import { styled } from '@linaria/react';
import { useCallback } from 'react';

import { WhatsappChatsSSESubscribeEffect } from '@/whatsapp/components/WhatsappChatsSSESubscribeEffect';
import { WhatsappConversationListPanel } from '@/whatsapp/components/WhatsappConversationListPanel';
import { WhatsappThreadPanel } from '@/whatsapp/components/WhatsappThreadPanel';
import { useSelectedWhatsappChatRecordId } from '@/whatsapp/hooks/useSelectedWhatsappChatRecordId';
import { useWhatsappChats } from '@/whatsapp/hooks/useWhatsappChats';

// `min-height: 0` on every flex ancestor is load-bearing: without it the scroll
// areas never shrink and the page grows past the viewport.
const StyledPage = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`;

export const WhatsappChatPageContent = () => {
  const { selectedWhatsappChatRecordId, selectWhatsappChatRecordId } =
    useSelectedWhatsappChatRecordId();

  const {
    whatsappChats,
    loading,
    hasMoreWhatsappChats,
    fetchMoreWhatsappChats,
    refetchWhatsappChats,
  } = useWhatsappChats();

  const handleWhatsappChatsChanged = useCallback(() => {
    void refetchWhatsappChats();
  }, [refetchWhatsappChats]);

  return (
    <StyledPage>
      <WhatsappChatsSSESubscribeEffect
        onWhatsappChatsChanged={handleWhatsappChatsChanged}
      />
      <WhatsappConversationListPanel
        whatsappChats={whatsappChats}
        selectedWhatsappChatRecordId={selectedWhatsappChatRecordId}
        isLoading={loading}
        hasMoreWhatsappChats={hasMoreWhatsappChats}
        onSelectWhatsappChatRecordId={selectWhatsappChatRecordId}
        onLoadMoreWhatsappChats={fetchMoreWhatsappChats}
      />
      <WhatsappThreadPanel
        selectedWhatsappChatRecordId={selectedWhatsappChatRecordId}
        onWhatsappMessageSent={handleWhatsappChatsChanged}
      />
    </StyledPage>
  );
};
