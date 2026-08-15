import {
  isNullWhatsappJid,
  parseWhatsappJid,
} from 'src/utils/parse-whatsapp-jid.util';
import {
  type WhatsappIdentity,
  type WhatsappLidToPhoneJid,
} from 'src/utils/types/whatsapp-identity.type';
import { isDefined } from 'src/utils/type-guards.util';

type ResolveWhatsappIdentityArgs = {
  observedJid: string;
  knownIdentity?: WhatsappIdentity;
  // Resolved by the caller from `GET /api/{session}/lids` — this function does no I/O.
  lidToPhoneJid?: WhatsappLidToPhoneJid;
};

export const resolveWhatsappIdentity = ({
  observedJid,
  knownIdentity,
  lidToPhoneJid,
}: ResolveWhatsappIdentityArgs): WhatsappIdentity | null => {
  const { kind, normalized } = parseWhatsappJid(observedJid);

  // Contract: an unaddressable jid returns null rather than throwing, so ingestion
  // can skip the record instead of failing the whole webhook batch.
  if (kind === 'UNKNOWN' || isNullWhatsappJid(observedJid)) {
    return null;
  }

  const lid =
    kind === 'LID'
      ? normalized
      : (lidToPhoneJid?.lid ?? knownIdentity?.lid ?? null);
  const phoneJid =
    kind === 'PHONE'
      ? normalized
      : (lidToPhoneJid?.pn ?? knownIdentity?.phoneJid ?? null);

  const knownIds = [
    ...(knownIdentity?.knownIds ?? []),
    normalized,
    lid,
    phoneJid,
  ]
    .filter(isDefined)
    // Normalize on the way in so a peer seen with and without a device suffix
    // never occupies two lookup entries.
    .map((id) => parseWhatsappJid(id).normalized);

  return {
    currentChatId: normalized,
    phoneJid,
    lid,
    knownIds: [...new Set(knownIds)],
  };
};
