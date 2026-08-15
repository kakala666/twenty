export type WhatsappJidKind =
  | 'PHONE'
  | 'LID'
  | 'DEVICE'
  | 'GROUP'
  | 'BROADCAST'
  | 'STATUS'
  | 'NEWSLETTER'
  | 'UNKNOWN';

// Shape returned by WAHA's `GET /api/{session}/lids` endpoint.
export type WhatsappLidToPhoneJid = {
  lid: string;
  pn: string;
};

export type WhatsappIdentity = {
  // The address the latest message arrived on — used when replying.
  currentChatId: string;
  phoneJid: string | null;
  lid: string | null;
  // Every address this peer has ever been seen as; used for lookup.
  knownIds: string[];
};

export type ParsedWhatsappJid = {
  kind: WhatsappJidKind;
  normalized: string;
  user: string;
};
