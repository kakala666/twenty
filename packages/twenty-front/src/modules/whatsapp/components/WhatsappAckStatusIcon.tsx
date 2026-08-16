import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconAlertCircle, IconCheck, IconClock } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type WhatsappAckStatus } from '@/whatsapp/types/WhatsappAckStatus';
import {
  getWhatsappAckRank,
  isWhatsappAckError,
} from '@/whatsapp/utils/getWhatsappAckRank';

const WHATSAPP_ACK_ICON_SIZE_IN_PX = 12;

// `IconChecks` is not re-exported by twenty-ui, so the double tick is composed
// from two overlapping single checks.
const StyledIconContainer = styled.span<{ isRead: boolean }>`
  align-items: center;
  color: ${({ isRead }) =>
    isRead ? themeCssVariables.color.blue : themeCssVariables.font.color.light};
  display: inline-flex;
  flex-shrink: 0;
`;

const StyledSecondCheck = styled.span`
  display: inline-flex;
  margin-left: -7px;
`;

const StyledErrorIconContainer = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.danger};
  display: inline-flex;
  flex-shrink: 0;
`;

const StyledPendingIconContainer = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.light};
  display: inline-flex;
  flex-shrink: 0;
`;

type WhatsappAckStatusIconProps = {
  ackStatus: WhatsappAckStatus | null;
};

export const WhatsappAckStatusIcon = ({
  ackStatus,
}: WhatsappAckStatusIconProps) => {
  const { t } = useLingui();

  if (isWhatsappAckError(ackStatus)) {
    return (
      <StyledErrorIconContainer title={t`Not delivered`}>
        <IconAlertCircle size={WHATSAPP_ACK_ICON_SIZE_IN_PX} />
      </StyledErrorIconContainer>
    );
  }

  const ackRank = getWhatsappAckRank(ackStatus);
  const isDeliveredToServer = ackRank >= getWhatsappAckRank('SERVER');
  const isDeliveredToDevice = ackRank >= getWhatsappAckRank('DEVICE');
  const isRead = ackRank >= getWhatsappAckRank('READ');

  if (!isDeliveredToServer) {
    return (
      <StyledPendingIconContainer title={t`Sending`}>
        <IconClock size={WHATSAPP_ACK_ICON_SIZE_IN_PX} />
      </StyledPendingIconContainer>
    );
  }

  const getDeliveryLabel = () => {
    if (isRead) {
      return t`Read`;
    }

    return isDeliveredToDevice ? t`Delivered` : t`Sent`;
  };

  return (
    <StyledIconContainer isRead={isRead} title={getDeliveryLabel()}>
      <IconCheck size={WHATSAPP_ACK_ICON_SIZE_IN_PX} />
      {isDeliveredToDevice && (
        <StyledSecondCheck>
          <IconCheck size={WHATSAPP_ACK_ICON_SIZE_IN_PX} />
        </StyledSecondCheck>
      )}
    </StyledIconContainer>
  );
};
