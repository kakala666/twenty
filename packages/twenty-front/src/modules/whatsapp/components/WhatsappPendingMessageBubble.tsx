import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type PendingWhatsappMessage } from '@/whatsapp/types/PendingWhatsappMessage';
import { formatDate } from '~/utils/date-utils';

const StyledBubbleRow = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const StyledBubble = styled.div<{ hasFailed: boolean }>`
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.inverted};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[1]};
  max-width: 70%;
  opacity: ${({ hasFailed }) => (hasFailed ? 0.5 : 0.7)};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  width: fit-content;
`;

const StyledText = styled.div`
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledMeta = styled.div`
  align-self: flex-end;
  display: flex;
  font-size: ${themeCssVariables.font.size.xxs};
  gap: ${themeCssVariables.spacing[1]};
`;

type WhatsappPendingMessageBubbleProps = {
  pendingWhatsappMessage: PendingWhatsappMessage;
};

export const WhatsappPendingMessageBubble = ({
  pendingWhatsappMessage,
}: WhatsappPendingMessageBubbleProps) => {
  const hasFailed = pendingWhatsappMessage.status === 'FAILED';

  return (
    <StyledBubbleRow>
      <StyledBubble hasFailed={hasFailed}>
        <StyledText>{pendingWhatsappMessage.text}</StyledText>
        <StyledMeta>
          {formatDate(pendingWhatsappMessage.createdAtIsoString, 'HH:mm')}
          {hasFailed ? <Trans>Failed</Trans> : <Trans>Sending</Trans>}
        </StyledMeta>
      </StyledBubble>
    </StyledBubbleRow>
  );
};
