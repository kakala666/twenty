import { isNonEmptyString } from 'src/utils/type-guards.util';

// The display name WhatsApp attaches to a message. WAHA surfaces it as
// `notifyName` on the normalized payload; under GOWS the authoritative copy is
// `_data.Info.PushName`. Outbound messages carry neither, so the envelope's
// `me.pushName` stands in for our own account.
export const extractWahaSenderName = (
  event: Record<string, unknown>,
): string | null => {
  const payload = (event.payload ?? {}) as Record<string, unknown>;

  if (isNonEmptyString(payload.notifyName)) {
    return payload.notifyName;
  }

  const rawInfo = (payload._data as { Info?: { PushName?: unknown } } | undefined)
    ?.Info;

  if (isNonEmptyString(rawInfo?.PushName)) {
    return rawInfo.PushName;
  }

  if (payload.fromMe === true) {
    const me = event.me as { pushName?: unknown } | undefined;

    if (isNonEmptyString(me?.pushName)) {
      return me.pushName;
    }
  }

  return null;
};
