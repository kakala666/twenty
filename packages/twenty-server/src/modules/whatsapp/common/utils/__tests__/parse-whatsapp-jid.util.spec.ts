import {
  isNullWhatsappJid,
  parseWhatsappJid,
} from 'src/modules/whatsapp/common/utils/parse-whatsapp-jid.util';

describe('parseWhatsappJid', () => {
  it('should classify as PHONE when the jid ends with @c.us', () => {
    expect(parseWhatsappJid('8619880607709@c.us')).toEqual({
      kind: 'PHONE',
      normalized: '8619880607709@c.us',
      user: '8619880607709',
    });
  });

  it('should classify as LID when the jid ends with @lid', () => {
    expect(parseWhatsappJid('15045975105550@lid')).toEqual({
      kind: 'LID',
      normalized: '15045975105550@lid',
      user: '15045975105550',
    });
  });

  it('should classify as DEVICE and strip the device suffix when the jid ends with @s.whatsapp.net', () => {
    expect(parseWhatsappJid('8613383234307:3@s.whatsapp.net')).toEqual({
      kind: 'DEVICE',
      normalized: '8613383234307@s.whatsapp.net',
      user: '8613383234307',
    });
  });

  it('should classify as GROUP when the jid ends with @g.us', () => {
    expect(parseWhatsappJid('120363427733002460@g.us')).toEqual({
      kind: 'GROUP',
      normalized: '120363427733002460@g.us',
      user: '120363427733002460',
    });
  });

  it('should classify as STATUS and not BROADCAST when the jid is status@broadcast', () => {
    expect(parseWhatsappJid('status@broadcast')).toEqual({
      kind: 'STATUS',
      normalized: 'status@broadcast',
      user: 'status',
    });
  });

  it('should classify as BROADCAST when the jid ends with @broadcast but the user is not status', () => {
    expect(parseWhatsappJid('1234567890123456@broadcast')).toEqual({
      kind: 'BROADCAST',
      normalized: '1234567890123456@broadcast',
      user: '1234567890123456',
    });
  });

  it('should classify as NEWSLETTER when the jid ends with @newsletter', () => {
    expect(parseWhatsappJid('120363144038483540@newsletter')).toEqual({
      kind: 'NEWSLETTER',
      normalized: '120363144038483540@newsletter',
      user: '120363144038483540',
    });
  });

  it.each([
    ['an empty string', ''],
    ['a string without an @', 'not-a-jid'],
    ['an unknown server', '123@example.com'],
    ['an empty user', '@c.us'],
  ])('should classify as UNKNOWN without throwing when given %s', (_, jid) => {
    expect(parseWhatsappJid(jid).kind).toBe('UNKNOWN');
  });
});

describe('isNullWhatsappJid', () => {
  it.each([
    ['0@c.us', true],
    ['0@s.whatsapp.net', true],
    ['0:1@s.whatsapp.net', true],
    ['8619880607709@c.us', false],
    ['15045975105550@lid', false],
    ['120363427733002460@g.us', false],
  ])(
    'should return %s -> %s when checking for the null jid',
    (jid, expected) => {
      expect(isNullWhatsappJid(jid as string)).toBe(expected);
    },
  );
});
