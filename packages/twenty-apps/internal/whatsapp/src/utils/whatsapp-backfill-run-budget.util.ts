export type WhatsappBackfillBudget = {
  maxWindows: number;
  maxMessages: number;
};

export type WhatsappBackfillSpend = {
  windowsFetched: number;
  messagesFetched: number;
};

// The run budget exists because a logic function is killed at `timeoutSeconds`
// (the executor caps at 900s): a killed run reports nothing and its watermarks
// are whatever happened to be written, so the work has to stop on its own terms
// and be resumed by the next invocation.
//
// Deliberately consulted BETWEEN windows only, never inside one. A window that
// has started always runs to its end: stopping mid-window would throw the
// window away anyway (the watermark may not cross a partial window), and a chat
// with more messages in one window than `maxMessages` would then never make any
// progress at all.
export const isWhatsappBackfillBudgetExhausted = (
  budget: WhatsappBackfillBudget,
  spend: WhatsappBackfillSpend,
): boolean =>
  spend.windowsFetched >= budget.maxWindows ||
  spend.messagesFetched >= budget.maxMessages;
