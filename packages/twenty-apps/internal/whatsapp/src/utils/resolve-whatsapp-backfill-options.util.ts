import { isNonEmptyString } from 'src/utils/type-guards.util';

// Defaults for the unattended cron run. Every one of them is overridable
// through the `dev:function:exec` payload, so a human can force a single chat
// or widen the horizon without a redeploy.
export const WHATSAPP_BACKFILL_DEFAULT_OPTIONS = {
  horizonDays: 90,
  maxWindowsPerRun: 40,
  maxMessagesPerRun: 800,
  maxChatsPerRun: 25,
} as const;

// Ceilings, so a typo in a hand-written payload cannot ask for more work than
// the function's execution timeout can absorb.
export const WHATSAPP_BACKFILL_OPTION_CEILINGS = {
  horizonDays: 3650,
  maxWindowsPerRun: 500,
  maxMessagesPerRun: 10000,
  maxChatsPerRun: 200,
} as const;

export type WhatsappBackfillOptions = {
  // A single `whatsappChat` record id, or null for every chat needing backfill.
  chatId: string | null;
  horizonDays: number;
  maxWindowsPerRun: number;
  maxMessagesPerRun: number;
  maxChatsPerRun: number;
};

// Anything not a usable count falls back to the default rather than failing the
// run: a cron trigger passes an empty payload, and an operator typing JSON by
// hand should not be able to turn the job into a no-op with `0` or `-1`.
const readBoundedCount = (
  value: unknown,
  fallback: number,
  ceiling: number,
): number => {
  const count =
    typeof value === 'number' && Number.isFinite(value)
      ? Math.floor(value)
      : Number.NaN;

  if (!Number.isFinite(count) || count < 1) {
    return fallback;
  }

  return Math.min(count, ceiling);
};

export const resolveWhatsappBackfillOptions = (
  payload: unknown,
): WhatsappBackfillOptions => {
  const input =
    typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  return {
    chatId: isNonEmptyString(input.chatId) ? input.chatId : null,
    horizonDays: readBoundedCount(
      input.horizonDays,
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.horizonDays,
      WHATSAPP_BACKFILL_OPTION_CEILINGS.horizonDays,
    ),
    maxWindowsPerRun: readBoundedCount(
      input.maxWindowsPerRun,
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxWindowsPerRun,
      WHATSAPP_BACKFILL_OPTION_CEILINGS.maxWindowsPerRun,
    ),
    maxMessagesPerRun: readBoundedCount(
      input.maxMessagesPerRun,
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxMessagesPerRun,
      WHATSAPP_BACKFILL_OPTION_CEILINGS.maxMessagesPerRun,
    ),
    maxChatsPerRun: readBoundedCount(
      input.maxChatsPerRun,
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxChatsPerRun,
      WHATSAPP_BACKFILL_OPTION_CEILINGS.maxChatsPerRun,
    ),
  };
};
