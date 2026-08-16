import { describe, expect, it } from 'vitest';

import { isWhatsappBackfillBudgetExhausted } from 'src/utils/whatsapp-backfill-run-budget.util';

const BUDGET = { maxWindows: 40, maxMessages: 800 };

describe('isWhatsappBackfillBudgetExhausted', () => {
  it('should report budget left at the start of a run', () => {
    expect(
      isWhatsappBackfillBudgetExhausted(BUDGET, {
        windowsFetched: 0,
        messagesFetched: 0,
      }),
    ).toBe(false);
  });

  it('should report budget left one window before the window ceiling', () => {
    expect(
      isWhatsappBackfillBudgetExhausted(BUDGET, {
        windowsFetched: 39,
        messagesFetched: 0,
      }),
    ).toBe(false);
  });

  it('should stop the run when the window ceiling is reached', () => {
    expect(
      isWhatsappBackfillBudgetExhausted(BUDGET, {
        windowsFetched: 40,
        messagesFetched: 0,
      }),
    ).toBe(true);
  });

  it('should stop the run when the message ceiling is reached', () => {
    expect(
      isWhatsappBackfillBudgetExhausted(BUDGET, {
        windowsFetched: 1,
        messagesFetched: 800,
      }),
    ).toBe(true);
  });

  // A window is always finished once started, so the message count can end up
  // past the ceiling. That still has to read as exhausted, not as wrapped.
  it('should stop the run when a finished window overshot the message ceiling', () => {
    expect(
      isWhatsappBackfillBudgetExhausted(BUDGET, {
        windowsFetched: 1,
        messagesFetched: 2400,
      }),
    ).toBe(true);
  });

  it('should stop the run when either ceiling alone is reached', () => {
    expect(
      isWhatsappBackfillBudgetExhausted(BUDGET, {
        windowsFetched: 40,
        messagesFetched: 800,
      }),
    ).toBe(true);
  });
});
