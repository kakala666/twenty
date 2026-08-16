import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type WhatsappAccountStatus =
  | 'WORKING'
  | 'STARTING'
  | 'SCAN_QR_CODE'
  | 'FAILED'
  | 'STOPPED';

// Hand-written: app-defined custom objects have no generated GraphQL types.
export type WhatsappAccountRecord = ObjectRecord & {
  id: string;
  sessionName: string;
  displayName: string;
  phoneNumber: string | null;
  status: WhatsappAccountStatus | null;
  lastSyncedAt: string | null;
};
