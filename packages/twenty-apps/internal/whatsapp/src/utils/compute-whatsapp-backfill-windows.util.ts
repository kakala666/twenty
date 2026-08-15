import { type WhatsappBackfillWindow } from 'src/utils/types/whatsapp-backfill-window.type';
import { isDefined } from 'src/utils/type-guards.util';

export type ComputeWhatsappBackfillWindowsInput = {
  // Do not import history older than this.
  oldestAt: Date;
  // Exclusive upper bound. Anchor it to the job's creation time rather than to
  // "now" so a retry recomputes an identical plan.
  newestAt: Date;
  // Oldest message already imported for this chat, if any. Everything from it
  // onwards has been done already.
  syncedFromAt: Date | null;
  windowSizeInMs: number;
};

// Plans a WhatsApp backfill as time windows instead of offset pages: WAHA's
// messages endpoint only offers limit/offset over a live chat, where arriving
// messages shift the offset and cause skips or duplicates. Time windows are
// stable, so paging stays safe within each one.
//
// Boundary convention: a window is the half-open real-time interval
// [start, end). WAHA's `filter.timestamp.gte`/`.lte` are inclusive and in unix
// SECONDS, so we emit gte = start seconds and lte = end seconds - 1. A message
// whose timestamp falls exactly on a boundary therefore belongs to the newer
// window only, and adjacent windows tile the range with no gap and no overlap.
//
// Pure and clock-free: every instant comes from the input, which keeps the plan
// deterministic across retries and under fake timers.
export const computeWhatsappBackfillWindows = ({
  oldestAt,
  newestAt,
  syncedFromAt,
  windowSizeInMs,
}: ComputeWhatsappBackfillWindowsInput): WhatsappBackfillWindow[] => {
  const oldestInMs = oldestAt.getTime();
  // `syncedFromAt` is the oldest message already stored, so everything from it
  // onwards is done and the plan stops there.
  const newestInMs = isDefined(syncedFromAt)
    ? Math.min(newestAt.getTime(), syncedFromAt.getTime())
    : newestAt.getTime();

  const windows: WhatsappBackfillWindow[] = [];

  // Anchored on newestAt and walked backwards, so recent windows are always
  // full-sized and only the oldest one can be a clamped remainder. This also
  // yields newest-first order, which is the order a user opening a chat wants.
  for (
    let endInMs = newestInMs;
    endInMs > oldestInMs;
    endInMs -= windowSizeInMs
  ) {
    const startInMs = Math.max(endInMs - windowSizeInMs, oldestInMs);

    windows.push({
      gteInSeconds: Math.floor(startInMs / 1000),
      lteInSeconds: Math.floor(endInMs / 1000) - 1,
    });
  }

  return windows;
};
