import { describe, expect, it } from 'vitest';

import { resolveWhatsappIdentity } from 'src/utils/resolve-whatsapp-identity.util';

describe('resolveWhatsappIdentity', () => {
  it('should set phoneJid and leave lid null when observing a phone jid with no prior identity', () => {
    expect(
      resolveWhatsappIdentity({ observedJid: '8619880607709@c.us' }),
    ).toEqual({
      currentChatId: '8619880607709@c.us',
      phoneJid: '8619880607709@c.us',
      lid: null,
      knownIds: ['8619880607709@c.us'],
    });
  });

  it('should keep the identity with lid set and phoneJid null when observing a lid jid with no mapping', () => {
    expect(
      resolveWhatsappIdentity({ observedJid: '15045975105550@lid' }),
    ).toEqual({
      currentChatId: '15045975105550@lid',
      phoneJid: null,
      lid: '15045975105550@lid',
      knownIds: ['15045975105550@lid'],
    });
  });

  it('should fill in both lid and phoneJid when observing a lid jid with a supplied lid-to-phone mapping', () => {
    expect(
      resolveWhatsappIdentity({
        observedJid: '15045975105550@lid',
        lidToPhoneJid: { lid: '15045975105550@lid', pn: '8619880607709@c.us' },
      }),
    ).toEqual({
      currentChatId: '15045975105550@lid',
      phoneJid: '8619880607709@c.us',
      lid: '15045975105550@lid',
      knownIds: ['15045975105550@lid', '8619880607709@c.us'],
    });
  });

  it('should move currentChatId to the new address while preserving the known ones when observing a new address for an existing identity', () => {
    expect(
      resolveWhatsappIdentity({
        observedJid: '15045975105550@lid',
        knownIdentity: {
          currentChatId: '8619880607709@c.us',
          phoneJid: '8619880607709@c.us',
          lid: null,
          knownIds: ['8619880607709@c.us'],
        },
      }),
    ).toEqual({
      currentChatId: '15045975105550@lid',
      phoneJid: '8619880607709@c.us',
      lid: '15045975105550@lid',
      knownIds: ['8619880607709@c.us', '15045975105550@lid'],
    });
  });

  it('should keep a single normalized entry when the same peer is observed with and without a device suffix', () => {
    const identity = resolveWhatsappIdentity({
      observedJid: '8613383234307@s.whatsapp.net',
      knownIdentity: {
        currentChatId: '8613383234307:1@s.whatsapp.net',
        phoneJid: null,
        lid: null,
        knownIds: ['8613383234307:1@s.whatsapp.net'],
      },
    });

    expect(identity?.knownIds).toEqual(['8613383234307@s.whatsapp.net']);
  });

  it.each([
    ['a group', '120363427733002460@g.us'],
    ['a status broadcast', 'status@broadcast'],
    ['a broadcast list', '1234567890123456@broadcast'],
  ])(
    'should yield a chat identity with no phoneJid and no lid when observing %s jid',
    (_, observedJid) => {
      expect(resolveWhatsappIdentity({ observedJid })).toEqual({
        currentChatId: observedJid,
        phoneJid: null,
        lid: null,
        knownIds: [observedJid],
      });
    },
  );

  it.each([
    ['the null phone jid', '0@c.us'],
    ['the null device jid', '0@s.whatsapp.net'],
    ['an unparseable jid', 'not-a-jid'],
  ])(
    'should return null without throwing when observing %s',
    (_, observedJid) => {
      expect(resolveWhatsappIdentity({ observedJid })).toBeNull();
    },
  );
});
