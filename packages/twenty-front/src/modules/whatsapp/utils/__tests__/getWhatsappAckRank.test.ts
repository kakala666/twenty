import {
  getHighestWhatsappAckStatus,
  getWhatsappAckRank,
  isWhatsappAckError,
} from '@/whatsapp/utils/getWhatsappAckRank';

describe('getWhatsappAckRank', () => {
  it('should order the acknowledgement ladder from UNKNOWN to PLAYED', () => {
    const rankedStatuses = [
      getWhatsappAckRank('UNKNOWN'),
      getWhatsappAckRank('PENDING'),
      getWhatsappAckRank('SERVER'),
      getWhatsappAckRank('DEVICE'),
      getWhatsappAckRank('READ'),
      getWhatsappAckRank('PLAYED'),
    ];

    const sortedRankedStatuses = [...rankedStatuses].sort(
      (first, second) => first - second,
    );

    expect(rankedStatuses).toEqual(sortedRankedStatuses);
    expect(new Set(rankedStatuses).size).toBe(rankedStatuses.length);
  });

  it('should rank ERROR below every successful state', () => {
    expect(getWhatsappAckRank('ERROR')).toBeLessThan(
      getWhatsappAckRank('UNKNOWN'),
    );
  });

  it('should treat a missing status as UNKNOWN', () => {
    expect(getWhatsappAckRank(null)).toBe(getWhatsappAckRank('UNKNOWN'));
    expect(getWhatsappAckRank(undefined)).toBe(getWhatsappAckRank('UNKNOWN'));
  });
});

describe('isWhatsappAckError', () => {
  it('should only report ERROR as an error', () => {
    expect(isWhatsappAckError('ERROR')).toBe(true);
    expect(isWhatsappAckError('READ')).toBe(false);
    expect(isWhatsappAckError(null)).toBe(false);
  });
});

describe('getHighestWhatsappAckStatus', () => {
  it('should keep the more advanced acknowledgement', () => {
    expect(getHighestWhatsappAckStatus('SERVER', 'READ')).toBe('READ');
    expect(getHighestWhatsappAckStatus('READ', 'SERVER')).toBe('READ');
  });

  it('should keep ERROR sticky whichever side it appears on', () => {
    expect(getHighestWhatsappAckStatus('ERROR', 'PLAYED')).toBe('ERROR');
    expect(getHighestWhatsappAckStatus('PLAYED', 'ERROR')).toBe('ERROR');
  });

  it('should fall back to UNKNOWN when both sides are missing', () => {
    expect(getHighestWhatsappAckStatus(null, undefined)).toBe('UNKNOWN');
  });
});
