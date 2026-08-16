import { describe, expect, it } from 'vitest';

import { type WahaMessage } from 'src/connector/types/waha-api.type';
import { buildWahaHistoryEvent } from 'src/utils/build-waha-history-event.util';
import { extractWahaSenderName } from 'src/utils/extract-waha-sender-name.util';
import { parseWahaMessageEvent } from 'src/utils/parse-waha-message-event.util';

const HISTORY_MESSAGE = {
  id: 'false_8619880607709@c.us_3EB0FBAD8FD8C900D5F82C',
  timestamp: 1704067200,
  from: '8619880607709@c.us',
  fromMe: false,
  body: 'hello from the past',
  ack: 3,
  ackName: 'READ',
  hasMedia: false,
  replyTo: null,
} as unknown as WahaMessage;

const buildEvent = (message: Partial<WahaMessage>) =>
  buildWahaHistoryEvent({
    message: { ...HISTORY_MESSAGE, ...message } as WahaMessage,
    sessionName: 'default',
  });

describe('buildWahaHistoryEvent', () => {
  it('should wrap a history entry into the envelope shape the webhook parser expects', () => {
    expect(buildEvent({})).toEqual({
      session: 'default',
      payload: HISTORY_MESSAGE,
    });
  });

  it('should produce an envelope the webhook parser reads identically to a live event', () => {
    const event = buildEvent({});

    expect(event).not.toBeNull();

    const message = parseWahaMessageEvent(
      event as Record<string, unknown>,
    );

    expect(message.externalId).toBe(HISTORY_MESSAGE.id);
    expect(message.waMessageId).toBe('3EB0FBAD8FD8C900D5F82C');
    expect(message.sessionName).toBe('default');
    expect(message.text).toBe('hello from the past');
    expect(message.fromMe).toBe(false);
    // payload.timestamp is unix SECONDS, so the parsed instant is 2024-01-01.
    expect(message.sentAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(message.ackStatus).toBe('READ');
  });

  // History carries no `me` block, so our own old messages simply have no
  // sender name. Leaving it null beats inventing one.
  it('should leave an outbound history message without a sender name', () => {
    const event = buildEvent({ fromMe: true });

    expect(extractWahaSenderName(event as Record<string, unknown>)).toBeNull();
  });

  it('should reject an entry carrying no message id, since that is the idempotency key', () => {
    expect(buildEvent({ id: undefined as unknown as string })).toBeNull();
    expect(buildEvent({ id: '' })).toBeNull();
  });

  it('should reject an entry whose timestamp would parse to an invalid date', () => {
    expect(buildEvent({ timestamp: undefined as unknown as number })).toBeNull();
    expect(buildEvent({ timestamp: '1704067200' as unknown as number })).toBeNull();
    expect(buildEvent({ timestamp: Number.NaN })).toBeNull();
  });

  // Would parse to an Invalid Date and throw only at write time, taking the
  // whole window down with it.
  it('should reject an entry whose timestamp is outside the representable date range', () => {
    expect(buildEvent({ timestamp: 1e15 })).toBeNull();
    expect(buildEvent({ timestamp: -1e15 })).toBeNull();
  });

  it('should reject an entry that is missing entirely', () => {
    expect(
      buildWahaHistoryEvent({
        message: undefined as unknown as WahaMessage,
        sessionName: 'default',
      }),
    ).toBeNull();
  });
});
