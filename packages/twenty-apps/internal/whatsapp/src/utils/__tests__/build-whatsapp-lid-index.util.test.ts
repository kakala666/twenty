import { describe, expect, it } from 'vitest';

import {
  buildWhatsappLidIndex,
  findWhatsappLidMapping,
} from 'src/utils/build-whatsapp-lid-index.util';

// Verified live: 15045975105550@lid <-> 8619880607709@c.us.
const LIVE_MAPPING = { lid: '15045975105550@lid', pn: '8619880607709@c.us' };

describe('buildWhatsappLidIndex', () => {
  it('should index a pair under both of its addresses', () => {
    const index = buildWhatsappLidIndex([LIVE_MAPPING]);

    expect(findWhatsappLidMapping(index, '15045975105550@lid')).toEqual(
      LIVE_MAPPING,
    );
    expect(findWhatsappLidMapping(index, '8619880607709@c.us')).toEqual(
      LIVE_MAPPING,
    );
  });

  it('should find a mapping when the jid carries a device suffix', () => {
    const index = buildWhatsappLidIndex([
      { lid: '15045975105550@lid', pn: '8619880607709@s.whatsapp.net' },
    ]);

    expect(
      findWhatsappLidMapping(index, '8619880607709:12@s.whatsapp.net'),
    ).toEqual({
      lid: '15045975105550@lid',
      pn: '8619880607709@s.whatsapp.net',
    });
  });

  it('should return undefined when the jid is not in the table', () => {
    const index = buildWhatsappLidIndex([LIVE_MAPPING]);

    expect(findWhatsappLidMapping(index, '8613383234307@c.us')).toBeUndefined();
  });

  it('should skip incomplete rows instead of throwing', () => {
    const index = buildWhatsappLidIndex([
      LIVE_MAPPING,
      { lid: '', pn: '8613383234307@c.us' },
      { lid: '999@lid', pn: '' },
    ] as { lid: string; pn: string }[]);

    expect(index.size).toBe(2);
    expect(findWhatsappLidMapping(index, '8613383234307@c.us')).toBeUndefined();
  });

  it('should return an empty index when given no mappings', () => {
    expect(buildWhatsappLidIndex([]).size).toBe(0);
  });
});
