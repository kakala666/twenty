import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { WhatsappConversationListEmptyState } from '@/whatsapp/components/WhatsappConversationListEmptyState';
import { WhatsappConversationListItem } from '@/whatsapp/components/WhatsappConversationListItem';
import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';

const WHATSAPP_CONVERSATION_LIST_SCROLL_INSTANCE_ID = 'whatsapp-conversations';

const StyledScrollContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
`;

const StyledListContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  padding: ${themeCssVariables.spacing[2]};
`;

// Settled rows never change, so the browser may skip layout and paint for the
// ones scrolled out of view; 56px approximates one conversation row.
const StyledListItemWrapper = styled.div`
  contain-intrinsic-size: auto 56px;
  content-visibility: auto;
`;

type WhatsappConversationListProps = {
  whatsappChats: WhatsappChatRecord[];
  selectedWhatsappChatRecordId: string | undefined;
  hasSearchText: boolean;
  isLoading: boolean;
  hasMoreWhatsappChats: boolean;
  onSelectWhatsappChatRecordId: (whatsappChatRecordId: string) => void;
  onLoadMoreWhatsappChats: () => void;
};

export const WhatsappConversationList = ({
  whatsappChats,
  selectedWhatsappChatRecordId,
  hasSearchText,
  isLoading,
  hasMoreWhatsappChats,
  onSelectWhatsappChatRecordId,
  onLoadMoreWhatsappChats,
}: WhatsappConversationListProps) => {
  if (whatsappChats.length === 0 && !isLoading) {
    return <WhatsappConversationListEmptyState hasSearchText={hasSearchText} />;
  }

  return (
    <StyledScrollContainer>
      <ScrollWrapper
        componentInstanceId={WHATSAPP_CONVERSATION_LIST_SCROLL_INSTANCE_ID}
      >
        <StyledListContent>
          {whatsappChats.map((whatsappChat) => (
            <StyledListItemWrapper key={whatsappChat.id}>
              <WhatsappConversationListItem
                whatsappChat={whatsappChat}
                isActive={whatsappChat.id === selectedWhatsappChatRecordId}
                onSelect={onSelectWhatsappChatRecordId}
              />
            </StyledListItemWrapper>
          ))}
          {hasMoreWhatsappChats && (
            <CustomResolverFetchMoreLoader
              loading={isLoading}
              onLastRowVisible={onLoadMoreWhatsappChats}
            />
          )}
        </StyledListContent>
      </ScrollWrapper>
    </StyledScrollContainer>
  );
};
