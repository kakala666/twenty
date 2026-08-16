import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Avatar, Tag } from 'twenty-ui/data-display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { SIDE_PANEL_TOP_BAR_HEIGHT } from '@/side-panel/constants/SidePanelTopBarHeight';
import { type WhatsappChatRecord } from '@/whatsapp/types/WhatsappChatRecord';
import { getWhatsappChatDisplayName } from '@/whatsapp/utils/getWhatsappChatDisplayName';
import { useNavigateApp } from '~/hooks/useNavigateApp';

const StyledHeader = styled.header`
  align-items: center;
  background-color: ${themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  height: ${SIDE_PANEL_TOP_BAR_HEIGHT}px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledHeaderIdentity = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const StyledHeaderTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledHeaderSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledHeaderLinks = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
`;

type WhatsappThreadHeaderProps = {
  whatsappChat: WhatsappChatRecord;
};

export const WhatsappThreadHeader = ({
  whatsappChat,
}: WhatsappThreadHeaderProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();

  const displayName = getWhatsappChatDisplayName(whatsappChat);
  const phoneNumber = whatsappChat.phoneJid?.split('@')[0];
  const linkedPerson = whatsappChat.person;
  const linkedCompany = whatsappChat.company;

  const openLinkedRecord = (
    objectNameSingular: string,
    objectRecordId: string,
  ) => {
    void navigateApp(AppPath.RecordShowPage, {
      objectNameSingular,
      objectRecordId,
    });
  };

  return (
    <StyledHeader>
      <Avatar
        avatarUrl={whatsappChat.person?.avatarUrl}
        placeholder={displayName}
        placeholderColorSeed={whatsappChat.id}
        size="md"
        type={whatsappChat.isGroup ? 'squared' : 'rounded'}
      />
      <StyledHeaderIdentity>
        <StyledHeaderTitle>{displayName}</StyledHeaderTitle>
        <StyledHeaderSubtitle>
          {whatsappChat.isGroup ? t`Group chat` : (phoneNumber ?? '')}
        </StyledHeaderSubtitle>
      </StyledHeaderIdentity>
      <StyledHeaderLinks>
        {isDefined(linkedPerson) && (
          <Tag
            color="blue"
            text={t`Contact`}
            onClick={() =>
              openLinkedRecord(CoreObjectNameSingular.Person, linkedPerson.id)
            }
          />
        )}
        {isDefined(linkedCompany) && isNonEmptyString(linkedCompany.name) && (
          <Tag
            color="purple"
            text={linkedCompany.name}
            onClick={() =>
              openLinkedRecord(CoreObjectNameSingular.Company, linkedCompany.id)
            }
          />
        )}
      </StyledHeaderLinks>
    </StyledHeader>
  );
};
