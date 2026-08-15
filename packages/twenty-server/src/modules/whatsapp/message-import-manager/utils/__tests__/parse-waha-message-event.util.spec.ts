import { parseWahaMessageEvent } from 'src/modules/whatsapp/message-import-manager/utils/parse-waha-message-event.util';

// Captured verbatim from the live WAHA instance (2026.8.1, engine GOWS) so the
// parser is pinned to what the wire actually carries, not to the documentation.
const REAL_OUTBOUND_TEXT_EVENT = {
  id: 'evt_01m03n3ktngb4wg1mxgjw7pj6z',
  timestamp: 1786829197141,
  event: 'message.any',
  session: 'default',
  me: {
    id: '8613383234307@c.us',
    pushName: 'test',
    lid: '120083712098456@lid',
    jid: '8613383234307:3@s.whatsapp.net',
  },
  payload: {
    id: 'true_8613383234307@c.us_3EB0FBAD8FD8C900D5F82C',
    timestamp: 1786829197,
    from: '8613383234307@c.us',
    fromMe: true,
    source: 'api',
    body: 'hello from sync module TDD setup',
    to: null,
    participant: null,
    hasMedia: false,
    media: null,
    ack: 1,
    location: null,
    vCards: null,
    ackName: 'SERVER',
    replyTo: null,
  },
};

// Same envelope shape as the captured event, with the group-specific fields the
// live account did not exercise: a four-segment composite id, `from` pointing at
// the `@g.us` chat and `participant` carrying the real author.
const GROUP_TEXT_EVENT = {
  id: 'evt_01m03n3ktngb4wg1mxgjw7pj70',
  timestamp: 1786829300123,
  event: 'message.any',
  session: 'default',
  me: {
    id: '8613383234307@c.us',
    pushName: 'test',
    lid: '120083712098456@lid',
    jid: '8613383234307:3@s.whatsapp.net',
  },
  payload: {
    id: 'false_120363402231234567@g.us_3EB0A1B2C3D4E5F60718_8619880607709@c.us',
    timestamp: 1786829300,
    from: '120363402231234567@g.us',
    fromMe: false,
    source: 'app',
    body: 'message sent into the group',
    to: null,
    participant: '8619880607709@c.us',
    hasMedia: false,
    media: null,
    ack: null,
    location: null,
    vCards: null,
    ackName: 'UNKNOWN',
    replyTo: null,
  },
};

// Inbound 1:1 message. The peer arrives as `@lid` (chats/contacts are keyed by
// `@c.us`, messages are not) and inbound messages carry `ack: null`.
const INBOUND_TEXT_EVENT = {
  id: 'evt_01m03n3ktngb4wg1mxgjw7pj71',
  timestamp: 1786829400987,
  event: 'message.any',
  session: 'default',
  me: {
    id: '8613383234307@c.us',
    pushName: 'test',
    lid: '120083712098456@lid',
    jid: '8613383234307:3@s.whatsapp.net',
  },
  payload: {
    id: 'false_15045975105550@lid_3EB0C7D8E9FA0B1C2D3E',
    timestamp: 1786829400,
    from: '15045975105550@lid',
    fromMe: false,
    source: 'app',
    body: 'a reply from the peer',
    to: null,
    participant: null,
    hasMedia: false,
    media: null,
    ack: null,
    location: null,
    vCards: null,
    ackName: 'UNKNOWN',
    replyTo: null,
  },
};

// Inbound image. Top-level `media` stays null because the poller does not pass
// `downloadMedia=true`; the real descriptor lives in the raw GOWS protobuf.
const INBOUND_IMAGE_EVENT = {
  id: 'evt_01m03n3ktngb4wg1mxgjw7pj72',
  timestamp: 1786829500456,
  event: 'message.any',
  session: 'default',
  me: {
    id: '8613383234307@c.us',
    pushName: 'test',
    lid: '120083712098456@lid',
    jid: '8613383234307:3@s.whatsapp.net',
  },
  payload: {
    id: 'false_15045975105550@lid_3EB0D4E5F6A7B8C9DA0B',
    timestamp: 1786829500,
    from: '15045975105550@lid',
    fromMe: false,
    source: 'app',
    body: 'look at this',
    to: null,
    participant: null,
    hasMedia: true,
    media: null,
    ack: null,
    location: null,
    vCards: null,
    ackName: 'UNKNOWN',
    replyTo: null,
    _data: {
      Message: {
        imageMessage: {
          URL: 'https://mmg.whatsapp.net/v/t62.7118-24/12345678_1234567890123456_1234567890123456789_n.enc',
          mimetype: 'image/jpeg',
          fileLength: 84213,
          fileSHA256: 'HsnKcJcnAv3ycV1Bb0fUiPGCbeTYPAuAmXQU6JQfFuw=',
          mediaKey: 'ANuVoYgEcRfw62yE8wc9SPVgcbUwSGA8QCiVLPYcKM4=',
          directPath:
            '/v/t62.7118-24/12345678_1234567890123456_1234567890123456789_n.enc',
          caption: 'look at this',
        },
      },
    },
  },
};

describe('parseWahaMessageEvent', () => {
  it('should map a real outbound text event to an inbound message', () => {
    const result = parseWahaMessageEvent(REAL_OUTBOUND_TEXT_EVENT);

    expect(result).toEqual({
      externalId: 'true_8613383234307@c.us_3EB0FBAD8FD8C900D5F82C',
      waMessageId: '3EB0FBAD8FD8C900D5F82C',
      sessionName: 'default',
      chatId: '8613383234307@c.us',
      senderId: '8613383234307@c.us',
      fromMe: true,
      text: 'hello from sync module TDD setup',
      sentAt: new Date('2026-08-15T21:26:37.000Z'),
      ackStatus: 'SERVER',
      replyToExternalId: null,
      hasMedia: false,
      mediaMimeType: null,
    });
  });

  it('should use the participant as sender and the group as chat when the message comes from a group', () => {
    const result = parseWahaMessageEvent(GROUP_TEXT_EVENT);

    expect(result.chatId).toBe('120363402231234567@g.us');
    expect(result.senderId).toBe('8619880607709@c.us');
    expect(result.waMessageId).toBe('3EB0A1B2C3D4E5F60718');
  });

  it('should map the ack status to UNKNOWN when the message is inbound and carries a null ack', () => {
    const result = parseWahaMessageEvent(INBOUND_TEXT_EVENT);

    expect(result.ackStatus).toBe('UNKNOWN');
    expect(result.fromMe).toBe(false);
  });

  it('should map the ack status to UNKNOWN when the ackName key is absent from the payload', () => {
    const { ackName: _ackName, ...payloadWithoutAckName } =
      INBOUND_TEXT_EVENT.payload;

    const result = parseWahaMessageEvent({
      ...INBOUND_TEXT_EVENT,
      payload: payloadWithoutAckName,
    });

    expect(result.ackStatus).toBe('UNKNOWN');
  });

  it('should read the reply target from replyTo when the payload carries a populated replyTo', () => {
    const result = parseWahaMessageEvent({
      ...INBOUND_TEXT_EVENT,
      payload: {
        ...INBOUND_TEXT_EVENT.payload,
        replyTo: {
          id: '3EB0FBAD8FD8C900D5F82C',
          participant: '8613383234307@c.us',
          body: 'hello from sync module TDD setup',
        },
      },
    });

    expect(result.replyToExternalId).toBe('3EB0FBAD8FD8C900D5F82C');
  });

  it('should fall back to the GOWS contextInfo stanzaID when replyTo is null', () => {
    const result = parseWahaMessageEvent({
      ...INBOUND_TEXT_EVENT,
      payload: {
        ...INBOUND_TEXT_EVENT.payload,
        replyTo: null,
        _data: {
          Message: {
            extendedTextMessage: {
              text: 'a reply from the peer',
              contextInfo: {
                stanzaID: '3EB0FBAD8FD8C900D5F82C',
                participant: '8613383234307@s.whatsapp.net',
                quotedMessage: {
                  conversation: 'hello from sync module TDD setup',
                },
              },
            },
          },
        },
      },
    });

    expect(result.replyToExternalId).toBe('3EB0FBAD8FD8C900D5F82C');
  });

  it('should read the media mime type from the raw descriptor when media was not downloaded', () => {
    const result = parseWahaMessageEvent(INBOUND_IMAGE_EVENT);

    expect(result.hasMedia).toBe(true);
    expect(result.mediaMimeType).toBe('image/jpeg');
  });

  it('should map the text to null when a media-only message carries an empty body', () => {
    const result = parseWahaMessageEvent({
      ...INBOUND_IMAGE_EVENT,
      payload: { ...INBOUND_IMAGE_EVENT.payload, body: '' },
    });

    expect(result.text).toBeNull();
  });

  it('should map the text to null when a media-only message carries a null body', () => {
    const result = parseWahaMessageEvent({
      ...INBOUND_IMAGE_EVENT,
      payload: { ...INBOUND_IMAGE_EVENT.payload, body: null },
    });

    expect(result.text).toBeNull();
  });
});
