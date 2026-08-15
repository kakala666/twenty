import { describe, expect, it } from 'vitest';

import {
  advanceWhatsappAckStatus,
  toWhatsappAckStatus,
} from 'src/utils/advance-whatsapp-ack-status.util';

describe('advanceWhatsappAckStatus', () => {
  it.each([
    ['UNKNOWN', 'PENDING'],
    ['PENDING', 'SERVER'],
    ['SERVER', 'DEVICE'],
    ['DEVICE', 'READ'],
    ['READ', 'PLAYED'],
  ])(
    'should move from %s to %s when the incoming status is the next rung',
    (current, incoming) => {
      expect(advanceWhatsappAckStatus(current, incoming)).toBe(incoming);
    },
  );

  it.each([
    ['READ', 'DEVICE'],
    ['READ', 'SERVER'],
    ['DEVICE', 'PENDING'],
    ['PLAYED', 'READ'],
    ['SERVER', 'UNKNOWN'],
  ])(
    'should keep %s when the incoming %s would move the status backwards',
    (current, incoming) => {
      expect(advanceWhatsappAckStatus(current, incoming)).toBe(current);
    },
  );

  // Acks are not delivered in order: a READ regularly lands before the DEVICE
  // ack for the same message.
  it('should keep READ when a DEVICE ack arrives after it', () => {
    expect(advanceWhatsappAckStatus('READ', 'DEVICE')).toBe('READ');
  });

  it('should adopt the incoming status when the message has none stored yet', () => {
    expect(advanceWhatsappAckStatus(null, 'UNKNOWN')).toBe('UNKNOWN');
    expect(advanceWhatsappAckStatus(undefined, 'READ')).toBe('READ');
  });

  it('should keep the current status when the incoming one is missing or unrecognized', () => {
    expect(advanceWhatsappAckStatus('SERVER', null)).toBe('SERVER');
    expect(advanceWhatsappAckStatus('SERVER', 'NOT_AN_ACK')).toBe('SERVER');
  });

  it('should return null when neither side carries a usable status', () => {
    expect(advanceWhatsappAckStatus(null, null)).toBeNull();
    expect(advanceWhatsappAckStatus('NOT_AN_ACK', undefined)).toBeNull();
  });

  it('should treat a stored but unrecognized status as absent so any ack applies', () => {
    expect(advanceWhatsappAckStatus('LEGACY_VALUE', 'PENDING')).toBe('PENDING');
  });

  // ERROR is WAHA's -1: a terminal send failure, not a lower rung of progress.
  it('should let ERROR override any other status and never be overridden', () => {
    expect(advanceWhatsappAckStatus('READ', 'ERROR')).toBe('ERROR');
    expect(advanceWhatsappAckStatus('UNKNOWN', 'ERROR')).toBe('ERROR');
    expect(advanceWhatsappAckStatus('ERROR', 'READ')).toBe('ERROR');
    expect(advanceWhatsappAckStatus('ERROR', 'PLAYED')).toBe('ERROR');
  });

  it('should be idempotent when the same status arrives twice', () => {
    expect(advanceWhatsappAckStatus('DEVICE', 'DEVICE')).toBe('DEVICE');
  });
});

describe('toWhatsappAckStatus', () => {
  it('should prefer ackName when WAHA supplies it', () => {
    expect(toWhatsappAckStatus('SERVER', 3)).toBe('SERVER');
  });

  it.each([
    [-1, 'ERROR'],
    [0, 'PENDING'],
    [1, 'SERVER'],
    [2, 'DEVICE'],
    [3, 'READ'],
    [4, 'PLAYED'],
  ])(
    'should map the numeric ack %s to %s when only the code is present',
    (ackCode, expected) => {
      expect(toWhatsappAckStatus(null, ackCode)).toBe(expected);
    },
  );

  it('should fall back to UNKNOWN when neither field is usable', () => {
    expect(toWhatsappAckStatus(null, null)).toBe('UNKNOWN');
    expect(toWhatsappAckStatus(undefined, undefined)).toBe('UNKNOWN');
    expect(toWhatsappAckStatus('NOPE', 99)).toBe('UNKNOWN');
  });
});
