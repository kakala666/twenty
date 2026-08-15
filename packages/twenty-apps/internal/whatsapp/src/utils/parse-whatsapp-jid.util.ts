import {
  type ParsedWhatsappJid,
  type WhatsappJidKind,
} from 'src/utils/types/whatsapp-identity.type';
import { isNonEmptyString } from 'src/utils/type-guards.util';

const KIND_BY_SERVER: Record<string, WhatsappJidKind> = {
  'c.us': 'PHONE',
  lid: 'LID',
  's.whatsapp.net': 'DEVICE',
  'g.us': 'GROUP',
  newsletter: 'NEWSLETTER',
};

const resolveKind = (user: string, server: string): WhatsappJidKind => {
  if (!isNonEmptyString(user) || !isNonEmptyString(server)) {
    return 'UNKNOWN';
  }

  // `status@broadcast` is the status feed and must be matched before the generic
  // broadcast-list case, which shares the same server.
  if (server === 'broadcast') {
    return user === 'status' ? 'STATUS' : 'BROADCAST';
  }

  return KIND_BY_SERVER[server] ?? 'UNKNOWN';
};

export const parseWhatsappJid = (jid: string): ParsedWhatsappJid => {
  const [rawUser, server = ''] = jid.split('@');
  // Device JIDs carry a `:<deviceId>` suffix (`8613383234307:3@s.whatsapp.net`)
  // that identifies the phone/companion, not the peer — it must not split identities.
  const [user] = rawUser.split(':');
  const kind = resolveKind(user, server);

  return {
    kind,
    // An unparseable jid is echoed back verbatim so callers can log the raw value.
    normalized: kind === 'UNKNOWN' ? jid : `${user}@${server}`,
    user,
  };
};

// WhatsApp emits `0@c.us` / `0@s.whatsapp.net` as a system placeholder for
// "no peer" — they are syntactically valid but never address a real chat.
export const isNullWhatsappJid = (jid: string): boolean => {
  const { kind, user } = parseWhatsappJid(jid);

  return user === '0' && (kind === 'PHONE' || kind === 'DEVICE');
};
