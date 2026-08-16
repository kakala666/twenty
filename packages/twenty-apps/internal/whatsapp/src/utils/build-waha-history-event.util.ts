import { type WahaMessage } from 'src/connector/types/waha-api.type';
import { isNonEmptyString } from 'src/utils/type-guards.util';

export type BuildWahaHistoryEventInput = {
  // One entry of the bare array the chat-messages endpoint returns.
  message: WahaMessage;
  sessionName: string;
};

// A REST history entry carries the same shape as a webhook event's `payload`,
// so it is wrapped in a synthetic envelope and fed to the very same parser and
// sender-name extractor the webhook uses. One parsing rule, one place to fix.
//
// The envelope carries no `me` block on purpose: history is lower fidelity than
// a live event, and inventing the fields it lacks would be worse than leaving
// them null.
//
// Returns null for an entry that cannot be ingested at all — no id means no
// idempotency key, and a missing timestamp would only surface as an Invalid
// Date at write time.
export const buildWahaHistoryEvent = ({
  message,
  sessionName,
}: BuildWahaHistoryEventInput): Record<string, unknown> | null => {
  if (!isNonEmptyString(message?.id)) {
    return null;
  }

  // Number.isFinite is false for every non-number, so this also rejects a
  // timestamp WAHA sent as a string or omitted entirely. The range check then
  // catches a value so far out that it can only become an Invalid Date — which
  // would otherwise surface as a throw at write time and take down the whole
  // window with it.
  if (!Number.isFinite(message?.timestamp)) {
    return null;
  }

  if (Number.isNaN(new Date(message.timestamp * 1000).getTime())) {
    return null;
  }

  return { session: sessionName, payload: message };
};
