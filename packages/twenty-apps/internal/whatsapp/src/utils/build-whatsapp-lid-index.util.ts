import { parseWhatsappJid } from 'src/utils/parse-whatsapp-jid.util';
import { type WhatsappLidToPhoneJid } from 'src/utils/types/whatsapp-identity.type';
import { isNonEmptyString } from 'src/utils/type-guards.util';

export type WhatsappLidIndex = Map<string, WhatsappLidToPhoneJid>;

// Indexes `GET /api/{session}/lids` under BOTH addresses of every pair, because
// chats are keyed by `@c.us` while messages carry the peer as `@lid` and the two
// never match textually. Keys are normalized so a device suffix cannot miss.
export const buildWhatsappLidIndex = (
  mappings: readonly WhatsappLidToPhoneJid[],
): WhatsappLidIndex => {
  const index: WhatsappLidIndex = new Map();

  for (const mapping of mappings) {
    if (!isNonEmptyString(mapping?.lid) || !isNonEmptyString(mapping?.pn)) {
      continue;
    }

    index.set(parseWhatsappJid(mapping.lid).normalized, mapping);
    index.set(parseWhatsappJid(mapping.pn).normalized, mapping);
  }

  return index;
};

export const findWhatsappLidMapping = (
  index: WhatsappLidIndex,
  jid: string,
): WhatsappLidToPhoneJid | undefined =>
  index.get(parseWhatsappJid(jid).normalized);
