import { type WhatsappAckStatus } from '@/whatsapp/types/WhatsappAckStatus';
import { isDefined } from 'twenty-shared/utils';

// ERROR is terminal rather than a rung of the ladder, so it sits below every
// successful state and must never be overwritten by a late lower ack.
export const WHATSAPP_ACK_ERROR_RANK = -1;

const WHATSAPP_ACK_RANK_BY_STATUS: Record<WhatsappAckStatus, number> = {
  ERROR: WHATSAPP_ACK_ERROR_RANK,
  UNKNOWN: 0,
  PENDING: 1,
  SERVER: 2,
  DEVICE: 3,
  READ: 4,
  PLAYED: 5,
};

export const getWhatsappAckRank = (
  ackStatus: WhatsappAckStatus | null | undefined,
): number => {
  if (!isDefined(ackStatus)) {
    return WHATSAPP_ACK_RANK_BY_STATUS.UNKNOWN;
  }

  return (
    WHATSAPP_ACK_RANK_BY_STATUS[ackStatus] ??
    WHATSAPP_ACK_RANK_BY_STATUS.UNKNOWN
  );
};

export const isWhatsappAckError = (
  ackStatus: WhatsappAckStatus | null | undefined,
): boolean => ackStatus === 'ERROR';

// Picks the more advanced of two acks so an out-of-order webhook cannot walk a
// message backwards; an ERROR on either side stays sticky.
export const getHighestWhatsappAckStatus = (
  firstAckStatus: WhatsappAckStatus | null | undefined,
  secondAckStatus: WhatsappAckStatus | null | undefined,
): WhatsappAckStatus => {
  if (
    isWhatsappAckError(firstAckStatus) ||
    isWhatsappAckError(secondAckStatus)
  ) {
    return 'ERROR';
  }

  return getWhatsappAckRank(firstAckStatus) >=
    getWhatsappAckRank(secondAckStatus)
    ? (firstAckStatus ?? 'UNKNOWN')
    : (secondAckStatus ?? 'UNKNOWN');
};
