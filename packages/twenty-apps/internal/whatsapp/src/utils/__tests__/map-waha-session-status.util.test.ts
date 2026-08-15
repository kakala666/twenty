import { describe, expect, it } from 'vitest';

import { mapWahaSessionStatus } from 'src/utils/map-waha-session-status.util';

describe('mapWahaSessionStatus', () => {
  it.each(['WORKING', 'STARTING', 'SCAN_QR_CODE', 'FAILED', 'STOPPED'])(
    'should map the WAHA status %s onto the matching select option',
    (status) => {
      expect(mapWahaSessionStatus(status)).toBe(status);
    },
  );

  it('should accept a lowercase status', () => {
    expect(mapWahaSessionStatus('working')).toBe('WORKING');
  });

  it.each([
    ['an unknown lifecycle state', 'HIBERNATING'],
    ['an empty string', ''],
    ['a null', null],
    ['a number', 42],
  ])('should return null when given %s', (_, status) => {
    expect(mapWahaSessionStatus(status)).toBeNull();
  });
});
