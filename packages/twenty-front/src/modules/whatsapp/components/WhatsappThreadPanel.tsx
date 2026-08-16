import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { WhatsappNoChatSelectedEmptyState } from '@/whatsapp/components/WhatsappNoChatSelectedEmptyState';
import { WhatsappThreadPanelContent } from '@/whatsapp/components/WhatsappThreadPanelContent';
import { useWhatsappChat } from '@/whatsapp/hooks/useWhatsappChat';

const StyledPlaceholderPanel = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  display: flex;
  flex: 1;
  justify-content: center;
  min-width: 0;
`;

type WhatsappThreadPanelProps = {
  selectedWhatsappChatRecordId: string | undefined;
  onWhatsappMessageSent: () => void;
};

export const WhatsappThreadPanel = ({
  selectedWhatsappChatRecordId,
  onWhatsappMessageSent,
}: WhatsappThreadPanelProps) => {
  const { whatsappChat, loading } = useWhatsappChat(
    selectedWhatsappChatRecordId,
  );

  if (!isDefined(whatsappChat)) {
    // A deep link is still resolving: showing the "nothing selected" copy here
    // would flash the wrong message before the record lands.
    const isResolvingDeepLink =
      isDefined(selectedWhatsappChatRecordId) && loading;

    return (
      <StyledPlaceholderPanel>
        {!isResolvingDeepLink && <WhatsappNoChatSelectedEmptyState />}
      </StyledPlaceholderPanel>
    );
  }

  // Remounted per conversation so the scroll wrapper, the initial scroll state
  // and the composer draft all reset with the thread.
  return (
    <WhatsappThreadPanelContent
      key={selectedWhatsappChatRecordId}
      whatsappChat={whatsappChat}
      onWhatsappMessageSent={onWhatsappMessageSent}
    />
  );
};
