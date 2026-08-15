import { computeWhatsappBackfillWindows } from 'src/modules/whatsapp/message-import-manager/utils/compute-whatsapp-backfill-windows.util';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

describe('computeWhatsappBackfillWindows', () => {
  it('should return a single window covering the range when the range is exactly one window long', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T01:00:00.000Z'),
      syncedFromAt: null,
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    expect(windows).toEqual([
      { gteInSeconds: 1704067200, lteInSeconds: 1704070799 },
    ]);
  });

  it('should cover the whole range with contiguous non-overlapping windows when the range spans several windows', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T03:00:00.000Z'),
      syncedFromAt: null,
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    expect(windows).toHaveLength(3);

    const ascendingWindows = [...windows].sort(
      (a, b) => a.gteInSeconds - b.gteInSeconds,
    );

    expect(ascendingWindows[0].gteInSeconds).toBe(1704067200);
    expect(ascendingWindows[2].lteInSeconds).toBe(1704078000 - 1);

    ascendingWindows.slice(1).forEach((window, index) => {
      expect(window.gteInSeconds).toBe(
        ascendingWindows[index].lteInSeconds + 1,
      );
    });
  });

  it('should return the windows newest first when the range spans several windows', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T03:00:00.000Z'),
      syncedFromAt: null,
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    expect(windows.map((window) => window.gteInSeconds)).toEqual([
      1704074400, 1704070800, 1704067200,
    ]);
  });

  it('should emit integer unix seconds when the range boundaries carry sub-second precision', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.500Z'),
      newestAt: new Date('2024-01-01T00:00:10.500Z'),
      syncedFromAt: null,
      windowSizeInMs: 5000,
    });

    expect(windows).toEqual([
      { gteInSeconds: 1704067205, lteInSeconds: 1704067209 },
      { gteInSeconds: 1704067200, lteInSeconds: 1704067204 },
    ]);

    windows.forEach((window) => {
      expect(Number.isInteger(window.gteInSeconds)).toBe(true);
      expect(Number.isInteger(window.lteInSeconds)).toBe(true);
      // Guards against leaking milliseconds: WAHA's filter is in seconds.
      expect(window.gteInSeconds).toBeLessThan(1e11);
      expect(window.lteInSeconds).toBeLessThan(1e11);
    });
  });

  it('should skip everything at or newer than syncedFromAt when part of the range is already imported', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T03:00:00.000Z'),
      syncedFromAt: new Date('2024-01-01T02:00:00.000Z'),
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    expect(windows).toEqual([
      { gteInSeconds: 1704070800, lteInSeconds: 1704074399 },
      { gteInSeconds: 1704067200, lteInSeconds: 1704070799 },
    ]);
  });

  it('should return an empty plan when syncedFromAt is older than oldestAt', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T03:00:00.000Z'),
      syncedFromAt: new Date('2023-12-31T00:00:00.000Z'),
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    expect(windows).toEqual([]);
  });

  it('should return an empty plan without throwing when newestAt is not after oldestAt', () => {
    const computeInvertedRange = () =>
      computeWhatsappBackfillWindows({
        oldestAt: new Date('2024-01-01T03:00:00.000Z'),
        newestAt: new Date('2024-01-01T00:00:00.000Z'),
        syncedFromAt: null,
        windowSizeInMs: ONE_HOUR_IN_MS,
      });

    expect(computeInvertedRange).not.toThrow();
    expect(computeInvertedRange()).toEqual([]);

    expect(
      computeWhatsappBackfillWindows({
        oldestAt: new Date('2024-01-01T00:00:00.000Z'),
        newestAt: new Date('2024-01-01T00:00:00.000Z'),
        syncedFromAt: null,
        windowSizeInMs: ONE_HOUR_IN_MS,
      }),
    ).toEqual([]);
  });

  it('should clamp the trailing window to oldestAt when the range is not a whole number of windows', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T02:30:00.000Z'),
      syncedFromAt: null,
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    expect(windows).toEqual([
      { gteInSeconds: 1704072600, lteInSeconds: 1704076199 },
      { gteInSeconds: 1704069000, lteInSeconds: 1704072599 },
      { gteInSeconds: 1704067200, lteInSeconds: 1704068999 },
    ]);
  });

  // Convention: each window is the half-open interval [start, end) in real time,
  // expressed for WAHA's inclusive second-granularity filter as
  // gte = start seconds, lte = end seconds - 1. So the second on a boundary
  // belongs to the newer window only, and adjacent windows touch without
  // overlapping.
  it('should assign a boundary second to exactly one window when windows are adjacent', () => {
    const windows = computeWhatsappBackfillWindows({
      oldestAt: new Date('2024-01-01T00:00:00.000Z'),
      newestAt: new Date('2024-01-01T03:00:00.000Z'),
      syncedFromAt: null,
      windowSizeInMs: ONE_HOUR_IN_MS,
    });

    const countWindowsContaining = (timestampInSeconds: number) =>
      windows.filter(
        (window) =>
          timestampInSeconds >= window.gteInSeconds &&
          timestampInSeconds <= window.lteInSeconds,
      ).length;

    // The exact boundary second lands in the newer window and nowhere else.
    expect(countWindowsContaining(1704070800)).toBe(1);
    expect(
      windows.find((window) => window.gteInSeconds === 1704070800),
    ).toBeDefined();
    expect(countWindowsContaining(1704070799)).toBe(1);
    expect(countWindowsContaining(1704074400)).toBe(1);

    // Every second of the range is covered exactly once: no gaps, no overlaps.
    const coverageCounts = new Set<number>();

    for (
      let timestampInSeconds = 1704067200;
      timestampInSeconds < 1704078000;
      timestampInSeconds++
    ) {
      coverageCounts.add(countWindowsContaining(timestampInSeconds));
    }

    expect([...coverageCounts]).toEqual([1]);
  });
});
