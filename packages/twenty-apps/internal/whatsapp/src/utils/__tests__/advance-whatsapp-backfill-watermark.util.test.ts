import { describe, expect, it } from 'vitest';

import { advanceWhatsappBackfillWatermark } from 'src/utils/advance-whatsapp-backfill-watermark.util';
import { computeWhatsappBackfillWindows } from 'src/utils/compute-whatsapp-backfill-windows.util';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

// Three contiguous one-hour windows over 2024-01-01T00:00 .. 03:00, newest
// first — the exact shape the planner emits.
const buildWindows = () =>
  computeWhatsappBackfillWindows({
    oldestAt: new Date('2024-01-01T00:00:00.000Z'),
    newestAt: new Date('2024-01-01T03:00:00.000Z'),
    syncedFromAt: null,
    windowSizeInMs: ONE_HOUR_IN_MS,
  });

describe('advanceWhatsappBackfillWatermark', () => {
  it('should not move the watermark when the run completed no window', () => {
    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2024-01-01T03:00:00.000Z'),
        windowResults: [],
      }),
    ).toBeNull();
  });

  it('should move the watermark back to the start of the only completed window', () => {
    const [newestWindow] = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2024-01-01T03:00:00.000Z'),
        windowResults: [{ window: newestWindow, isComplete: true }],
      }),
    ).toEqual(new Date('2024-01-01T02:00:00.000Z'));
  });

  it('should move the watermark back past every window when the whole plan completed', () => {
    const windows = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: null,
        windowResults: windows.map((window) => ({
          window,
          isComplete: true,
        })),
      }),
    ).toEqual(new Date('2024-01-01T00:00:00.000Z'));
  });

  it('should stop in front of a partially imported window instead of marking it done', () => {
    const windows = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2024-01-01T03:00:00.000Z'),
        windowResults: [
          { window: windows[0], isComplete: true },
          { window: windows[1], isComplete: false },
        ],
      }),
    ).toEqual(new Date('2024-01-01T02:00:00.000Z'));
  });

  it('should not move the watermark at all when the very first window is partial', () => {
    const windows = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2024-01-01T03:00:00.000Z'),
        windowResults: [
          { window: windows[0], isComplete: false },
          { window: windows[1], isComplete: true },
        ],
      }),
    ).toBeNull();
  });

  // The hole left by a partial window must never be jumped over, even when the
  // windows on its far side were imported in full.
  it('should not cross a partial window when a later window did complete', () => {
    const windows = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2024-01-01T03:00:00.000Z'),
        windowResults: [
          { window: windows[0], isComplete: true },
          { window: windows[1], isComplete: false },
          { window: windows[2], isComplete: true },
        ],
      }),
    ).toEqual(new Date('2024-01-01T02:00:00.000Z'));
  });

  it('should never move the watermark forward when it already sits older than the completed windows', () => {
    const [newestWindow] = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2023-06-01T00:00:00.000Z'),
        windowResults: [{ window: newestWindow, isComplete: true }],
      }),
    ).toBeNull();
  });

  it('should not move the watermark when the completed window starts exactly at it', () => {
    const [newestWindow] = buildWindows();

    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: new Date('2024-01-01T02:00:00.000Z'),
        windowResults: [{ window: newestWindow, isComplete: true }],
      }),
    ).toBeNull();
  });

  // gte is unix SECONDS; a watermark in milliseconds would be off by a factor
  // of a thousand and silently mark decades as imported.
  it('should read the window start as unix seconds when building the watermark', () => {
    expect(
      advanceWhatsappBackfillWatermark({
        currentSyncedFromAt: null,
        windowResults: [
          {
            window: { gteInSeconds: 1704067200, lteInSeconds: 1704070799 },
            isComplete: true,
          },
        ],
      })?.toISOString(),
    ).toBe('2024-01-01T00:00:00.000Z');
  });
});
