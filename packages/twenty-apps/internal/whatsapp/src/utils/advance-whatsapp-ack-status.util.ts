import {
  WHATSAPP_ACK_STATUSES,
  type WhatsappAckStatus,
} from 'src/utils/types/whatsapp-inbound-message.type';
import { isDefined } from 'src/utils/type-guards.util';

// The ack ladder, lowest first. WhatsApp does NOT guarantee ordered delivery of
// ack events — a READ routinely arrives before the DEVICE (delivered) ack for
// the same message — so stored status may only ever move forward.
const ACK_STATUS_RANK: Record<WhatsappAckStatus, number> = {
  UNKNOWN: 0,
  PENDING: 1,
  SERVER: 2,
  DEVICE: 3,
  READ: 4,
  PLAYED: 5,
  // ERROR is WAHA's `-1`: not "less progress" but a terminal send failure. It is
  // the absorbing top of the lattice, so it is never overwritten and never lost.
  ERROR: Number.POSITIVE_INFINITY,
};

const isWhatsappAckStatus = (value: unknown): value is WhatsappAckStatus =>
  WHATSAPP_ACK_STATUSES.includes(value as WhatsappAckStatus);

export const getWhatsappAckStatusRank = (
  status: WhatsappAckStatus | null | undefined,
): number => (isDefined(status) ? ACK_STATUS_RANK[status] : -1);

// Returns the status to store. Unknown/absent incoming values keep the current
// one rather than resetting it, so a malformed ack event is a no-op.
export const advanceWhatsappAckStatus = (
  currentStatus: string | null | undefined,
  incomingStatus: string | null | undefined,
): WhatsappAckStatus | null => {
  const current = isWhatsappAckStatus(currentStatus) ? currentStatus : null;
  const incoming = isWhatsappAckStatus(incomingStatus) ? incomingStatus : null;

  if (!isDefined(incoming)) {
    return current;
  }

  return getWhatsappAckStatusRank(incoming) > getWhatsappAckStatusRank(current)
    ? incoming
    : current;
};

// WAHA's ack events carry the numeric code; `ackName` is only present on message
// payloads. Values verified live: null -> UNKNOWN, 0..3 observed, -1/4 documented.
const ACK_STATUS_BY_CODE: Record<number, WhatsappAckStatus> = {
  [-1]: 'ERROR',
  0: 'PENDING',
  1: 'SERVER',
  2: 'DEVICE',
  3: 'READ',
  4: 'PLAYED',
};

export const toWhatsappAckStatus = (
  ackName: unknown,
  ackCode?: unknown,
): WhatsappAckStatus => {
  if (isWhatsappAckStatus(ackName)) {
    return ackName;
  }

  if (typeof ackCode === 'number' && isDefined(ACK_STATUS_BY_CODE[ackCode])) {
    return ACK_STATUS_BY_CODE[ackCode];
  }

  return 'UNKNOWN';
};
