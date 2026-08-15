import { isNonEmptyString } from 'src/utils/type-guards.util';

// Mirrors the `status` select options on `whatsappAccount`. Duplicated as string
// literals rather than imported from the object file so logic-function bundles
// never pull a `defineObject` module in.
export const WHATSAPP_ACCOUNT_STATUSES = [
  'WORKING',
  'STARTING',
  'SCAN_QR_CODE',
  'FAILED',
  'STOPPED',
] as const;

export type WhatsappAccountStatusValue =
  (typeof WHATSAPP_ACCOUNT_STATUSES)[number];

// WAHA may add lifecycle states; an unrecognized one becomes null rather than
// failing the sync, since the select field only knows the five above.
export const mapWahaSessionStatus = (
  wahaStatus: unknown,
): WhatsappAccountStatusValue | null => {
  if (!isNonEmptyString(wahaStatus)) {
    return null;
  }

  const normalized = wahaStatus.toUpperCase();

  return (
    WHATSAPP_ACCOUNT_STATUSES.find((status) => status === normalized) ?? null
  );
};
