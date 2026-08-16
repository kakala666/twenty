import { describe, expect, it } from 'vitest';

import {
  resolveWhatsappBackfillOptions,
  WHATSAPP_BACKFILL_DEFAULT_OPTIONS,
  WHATSAPP_BACKFILL_OPTION_CEILINGS,
} from 'src/utils/resolve-whatsapp-backfill-options.util';

describe('resolveWhatsappBackfillOptions', () => {
  it('should fall back to every default when the cron passes an empty payload', () => {
    expect(resolveWhatsappBackfillOptions({})).toEqual({
      chatId: null,
      ...WHATSAPP_BACKFILL_DEFAULT_OPTIONS,
    });
  });

  it('should fall back to every default when there is no payload at all', () => {
    expect(resolveWhatsappBackfillOptions(undefined)).toEqual({
      chatId: null,
      ...WHATSAPP_BACKFILL_DEFAULT_OPTIONS,
    });
  });

  it('should keep the overrides a human passed on the command line', () => {
    expect(
      resolveWhatsappBackfillOptions({
        chatId: '20202020-2020-4020-8020-202020202020',
        horizonDays: 365,
        maxWindowsPerRun: 5,
        maxMessagesPerRun: 50,
        maxChatsPerRun: 1,
      }),
    ).toEqual({
      chatId: '20202020-2020-4020-8020-202020202020',
      horizonDays: 365,
      maxWindowsPerRun: 5,
      maxMessagesPerRun: 50,
      maxChatsPerRun: 1,
    });
  });

  it('should ignore a chatId that is not a usable string', () => {
    expect(resolveWhatsappBackfillOptions({ chatId: '' }).chatId).toBeNull();
    expect(resolveWhatsappBackfillOptions({ chatId: 42 }).chatId).toBeNull();
  });

  // A zero or negative budget would turn the job into a silent no-op forever.
  it('should fall back to the default when a budget is zero or negative', () => {
    const options = resolveWhatsappBackfillOptions({
      maxWindowsPerRun: 0,
      maxMessagesPerRun: -10,
      horizonDays: 0,
    });

    expect(options.maxWindowsPerRun).toBe(
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxWindowsPerRun,
    );
    expect(options.maxMessagesPerRun).toBe(
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxMessagesPerRun,
    );
    expect(options.horizonDays).toBe(
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.horizonDays,
    );
  });

  it('should fall back to the default when a budget is not a finite number', () => {
    const options = resolveWhatsappBackfillOptions({
      maxWindowsPerRun: 'lots',
      maxMessagesPerRun: Number.NaN,
      maxChatsPerRun: Number.POSITIVE_INFINITY,
    });

    expect(options.maxWindowsPerRun).toBe(
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxWindowsPerRun,
    );
    expect(options.maxMessagesPerRun).toBe(
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxMessagesPerRun,
    );
    expect(options.maxChatsPerRun).toBe(
      WHATSAPP_BACKFILL_DEFAULT_OPTIONS.maxChatsPerRun,
    );
  });

  it('should clamp a budget asking for more work than a run can finish', () => {
    expect(
      resolveWhatsappBackfillOptions({
        horizonDays: 100000,
        maxWindowsPerRun: 100000,
        maxMessagesPerRun: 100000,
        maxChatsPerRun: 100000,
      }),
    ).toEqual({ chatId: null, ...WHATSAPP_BACKFILL_OPTION_CEILINGS });
  });

  it('should truncate a fractional budget to a whole count', () => {
    expect(
      resolveWhatsappBackfillOptions({ maxWindowsPerRun: 3.9 })
        .maxWindowsPerRun,
    ).toBe(3);
  });

  it('should fall back to the defaults when the payload is not an object', () => {
    expect(resolveWhatsappBackfillOptions('{"chatId":"x"}')).toEqual({
      chatId: null,
      ...WHATSAPP_BACKFILL_DEFAULT_OPTIONS,
    });
    expect(resolveWhatsappBackfillOptions(null)).toEqual({
      chatId: null,
      ...WHATSAPP_BACKFILL_DEFAULT_OPTIONS,
    });
  });
});
