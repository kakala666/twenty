import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';
import { getWhatsappChatDisplayName } from '@/whatsapp/utils/getWhatsappChatDisplayName';
import { beautifyPastDateRelativeToNowShort } from '~/utils/date-utils';

const StyledItem = styled.button<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive ? themeCssVariables.background.transparent.light : 'transparent'};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: inherit;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledItemBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  min-width: 0;
`;

const StyledItemName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemTime = styled.div`
  color: ${themeCssVariables.font.color.light};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.xs};
`;

type WhatsappConversationListItemProps = {
  whatsappChat: WhatsappChatRecord;
  isActive: boolean;
  onSelect: (whatsappChatRecordId: string) => void;
};

export const WhatsappConversationListItem = ({
  whatsappChat,
  isActive,
  onSelect,
}: WhatsappConversationListItemProps) => {
  const displayName = getWhatsappChatDisplayName(whatsappChat);

  return (
    <StyledItem isActive={isActive} onClick={() => onSelect(whatsappChat.id)}>
      <Avatar
        avatarUrl={whatsappChat.person?.avatarUrl}
        placeholder={displayName}
        placeholderColorSeed={whatsappChat.id}
        size="md"
        type={whatsappChat.isGroup ? 'squared' : 'rounded'}
      />
      <StyledItemBody>
        <StyledItemName>{displayName}</StyledItemName>
        {isDefined(whatsappChat.company?.name) && (
          <StyledItemSubtitle>{whatsappChat.company.name}</StyledItemSubtitle>
        )}
      </StyledItemBody>
      {isDefined(whatsappChat.lastMessageAt) && (
        <StyledItemTime>
          {beautifyPastDateRelativeToNowShort(whatsappChat.lastMessageAt)}
        </StyledItemTime>
      )}
    </StyledItem>
  );
};
