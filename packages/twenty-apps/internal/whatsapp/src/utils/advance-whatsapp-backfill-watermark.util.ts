import { type WhatsappBackfillWindow } from 'src/utils/types/whatsapp-backfill-window.type';
import { isDefined } from 'src/utils/type-guards.util';

export type WhatsappBackfillWindowResult = {
  window: WhatsappBackfillWindow;
  // True only when every page of the window was fetched and stored. A window
  // cut short by the run budget, by the page guard or by a WAHA error is false.
  isComplete: boolean;
};

export type AdvanceWhatsappBackfillWatermarkInput = {
  // `whatsappChat.syncedFromAt` as it stands before this run, or null when the
  // chat has never been backfilled.
  currentSyncedFromAt: Date | null;
  // The run's window results, in the newest-first order the plan produced.
  windowResults: readonly WhatsappBackfillWindowResult[];
};

// The watermark answers exactly one question: "from which instant onwards is
// this chat's history complete?". It may therefore only ever move BACKWARDS,
// and only across windows that were imported in full.
//
// Windows tile the range without gaps and arrive newest first, so only the
// LEADING run of complete windows may be crossed. A window abandoned half way
// leaves a hole, and everything older than that hole has to stay unclaimed —
// even when a later window happens to have been imported successfully — or the
// next run would skip straight past the missing messages.
//
// Returns the instant to store, or null when the watermark must not move. A new
// watermark is always a window start, so null is never an ambiguous answer.
export const advanceWhatsappBackfillWatermark = ({
  currentSyncedFromAt,
  windowResults,
}: AdvanceWhatsappBackfillWatermarkInput): Date | null => {
  let oldestCompletedStartInMs: number | null = null;

  for (const { window, isComplete } of windowResults) {
    if (!isComplete) {
      break;
    }

    const startInMs = window.gteInSeconds * 1000;

    oldestCompletedStartInMs =
      oldestCompletedStartInMs === null
        ? startInMs
        : Math.min(oldestCompletedStartInMs, startInMs);
  }

  if (!isDefined(oldestCompletedStartInMs)) {
    return null;
  }

  // Guards against a stale or hand-edited watermark: the field records how far
  // back history is complete, so a forward move would silently drop coverage.
  if (
    isDefined(currentSyncedFromAt) &&
    oldestCompletedStartInMs >= currentSyncedFromAt.getTime()
  ) {
    return null;
  }

  return new Date(oldestCompletedStartInMs);
};
