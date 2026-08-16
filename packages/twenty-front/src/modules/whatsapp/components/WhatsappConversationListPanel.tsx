import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { SearchInput } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { SIDE_PANEL_TOP_BAR_HEIGHT } from '@/side-panel/constants/SidePanelTopBarHeight';
import { WhatsappAccountStatusTag } from '@/whatsapp/components/WhatsappAccountStatusTag';
import { WhatsappConversationList } from '@/whatsapp/components/WhatsappConversationList';
import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';
import { getWhatsappChatDisplayName } from '@/whatsapp/utils/getWhatsappChatDisplayName';

const WHATSAPP_CONVERSATION_LIST_PANEL_WIDTH_IN_PX = 320;

const StyledPanel = styled.aside`
  background: ${themeCssVariables.background.secondary};
  border-right: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-height: 0;
  width: ${WHATSAPP_CONVERSATION_LIST_PANEL_WIDTH_IN_PX}px;
`;

const StyledPanelHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  height: ${SIDE_PANEL_TOP_BAR_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledPanelTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSearchContainer = styled.div`
  flex-shrink: 0;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

type WhatsappConversationListPanelProps = {
  whatsappChats: WhatsappChatRecord[];
  selectedWhatsappChatRecordId: string | undefined;
  isLoading: boolean;
  hasMoreWhatsappChats: boolean;
  onSelectWhatsappChatRecordId: (whatsappChatRecordId: string) => void;
  onLoadMoreWhatsappChats: () => void;
};

export const WhatsappConversationListPanel = ({
  whatsappChats,
  selectedWhatsappChatRecordId,
  isLoading,
  hasMoreWhatsappChats,
  onSelectWhatsappChatRecordId,
  onLoadMoreWhatsappChats,
}: WhatsappConversationListPanelProps) => {
  const { t } = useLingui();
  const [searchText, setSearchText] = useState('');

  // Filtered client-side over the loaded pages only: a server-side search would
  // need its own query and would fight the live `lastMessageAt` ordering.
  const filteredWhatsappChats = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase();

    if (normalizedSearchText === '') {
      return whatsappChats;
    }

    return whatsappChats.filter((whatsappChat) =>
      [
        getWhatsappChatDisplayName(whatsappChat),
        whatsappChat.phoneJid ?? '',
        whatsappChat.company?.name ?? '',
      ].some((searchableValue) =>
        searchableValue.toLowerCase().includes(normalizedSearchText),
      ),
    );
  }, [searchText, whatsappChats]);

  return (
    <StyledPanel>
      <StyledPanelHeader>
        <StyledPanelTitle>{t`WhatsApp`}</StyledPanelTitle>
        <WhatsappAccountStatusTag />
      </StyledPanelHeader>
      <StyledSearchContainer>
        <SearchInput
          value={searchText}
          onChange={setSearchText}
          placeholder={t`Search conversations`}
          aria-label={t`Search conversations`}
        />
      </StyledSearchContainer>
      <WhatsappConversationList
        whatsappChats={filteredWhatsappChats}
        selectedWhatsappChatRecordId={selectedWhatsappChatRecordId}
        hasSearchText={searchText.trim() !== ''}
        isLoading={isLoading}
        hasMoreWhatsappChats={hasMoreWhatsappChats && searchText.trim() === ''}
        onSelectWhatsappChatRecordId={onSelectWhatsappChatRecordId}
        onLoadMoreWhatsappChats={onLoadMoreWhatsappChats}
      />
    </StyledPanel>
  );
};
