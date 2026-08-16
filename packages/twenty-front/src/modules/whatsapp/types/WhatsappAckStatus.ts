export type WhatsappAckStatus =
  | 'UNKNOWN'
  | 'ERROR'
  | 'PENDING'
  | 'SERVER'
  | 'DEVICE'
  | 'READ'
  | 'PLAYED';

export type WhatsappMessageDirection = 'INBOUND' | 'OUTBOUND';
