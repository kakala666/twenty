import { describe, expect, it } from 'vitest';

import { extractWahaSenderName } from 'src/utils/extract-waha-sender-name.util';

describe('extractWahaSenderName', () => {
  it('should prefer notifyName when the normalized payload carries one', () => {
    expect(
      extractWahaSenderName({
        payload: { notifyName: 'Ada', _data: { Info: { PushName: 'Other' } } },
      }),
    ).toBe('Ada');
  });

  it('should fall back to the raw GOWS PushName when notifyName is absent', () => {
    expect(
      extractWahaSenderName({ payload: { _data: { Info: { PushName: 'Ada' } } } }),
    ).toBe('Ada');
  });

  it('should use our own push name from the envelope for an outbound message', () => {
    expect(
      extractWahaSenderName({
        me: { pushName: 'test' },
        payload: { fromMe: true },
      }),
    ).toBe('test');
  });

  it('should not use our own push name for an inbound message', () => {
    expect(
      extractWahaSenderName({
        me: { pushName: 'test' },
        payload: { fromMe: false },
      }),
    ).toBeNull();
  });

  it('should return null when no name is available anywhere', () => {
    expect(extractWahaSenderName({})).toBeNull();
    expect(extractWahaSenderName({ payload: {} })).toBeNull();
  });
});
