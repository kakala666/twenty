import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { WhatsappAckStatusIcon } from '@/whatsapp/components/WhatsappAckStatusIcon';
import { type WhatsappMessageRecord } from '@/whatsapp/types/WhatsappMessageRecord';
import { formatDate } from '~/utils/date-utils';

const StyledBubbleRow = styled.div<{ isOutbound: boolean }>`
  display: flex;
  justify-content: ${({ isOutbound }) =>
    isOutbound ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

const StyledBubble = styled.div<{ isOutbound: boolean }>`
  background: ${({ isOutbound }) =>
    isOutbound
      ? themeCssVariables.color.blue
      : themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${({ isOutbound }) =>
    isOutbound
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[1]};
  max-width: 70%;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  width: fit-content;
`;

const StyledSenderName = styled.div`
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  opacity: 0.8;
`;

const StyledQuotedPreview = styled.div`
  border-left: 2px solid currentColor;
  font-size: ${themeCssVariables.font.size.xs};
  opacity: 0.7;
  padding-left: ${themeCssVariables.spacing[2]};
`;

const StyledText = styled.div`
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledMediaNotice = styled.div`
  font-size: ${themeCssVariables.font.size.xs};
  font-style: italic;
  opacity: 0.8;
`;

const StyledMeta = styled.div`
  align-items: center;
  align-self: flex-end;
  display: flex;
  font-size: ${themeCssVariables.font.size.xxs};
  gap: ${themeCssVariables.spacing[1]};
  opacity: 0.8;
`;

type WhatsappMessageBubbleProps = {
  whatsappMessage: WhatsappMessageRecord;
  shouldShowSenderName: boolean;
};

export const WhatsappMessageBubble = ({
  whatsappMessage,
  shouldShowSenderName,
}: WhatsappMessageBubbleProps) => {
  const isOutbound = whatsappMessage.direction === 'OUTBOUND';

  return (
    <StyledBubbleRow isOutbound={isOutbound}>
      <StyledBubble isOutbound={isOutbound}>
        {shouldShowSenderName &&
          isNonEmptyString(whatsappMessage.senderName) && (
            <StyledSenderName>{whatsappMessage.senderName}</StyledSenderName>
          )}
        {isNonEmptyString(whatsappMessage.replyToExternalId) && (
          <StyledQuotedPreview>
            <Trans>Reply</Trans>
          </StyledQuotedPreview>
        )}
        {whatsappMessage.hasMedia && (
          <StyledMediaNotice>
            <Trans>Attachment</Trans>
          </StyledMediaNotice>
        )}
        {isNonEmptyString(whatsappMessage.text) && (
          <StyledText>{whatsappMessage.text}</StyledText>
        )}
        <StyledMeta>
          {isDefined(whatsappMessage.sentAt) &&
            formatDate(whatsappMessage.sentAt, 'HH:mm')}
          {isOutbound && (
            <WhatsappAckStatusIcon ackStatus={whatsappMessage.ackStatus} />
          )}
        </StyledMeta>
      </StyledBubble>
    </StyledBubbleRow>
  );
};
