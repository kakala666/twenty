export type WahaClientOptions = {
  baseUrl: string;
  apiKey: string;
};

// The connected number, as reported on the session. `id` is the phone JID
// (`@c.us`), `lid` the privacy id, `jid` the device JID (`@s.whatsapp.net`).
export type WahaSessionMe = {
  id?: string | null;
  pushName?: string | null;
  lid?: string | null;
  jid?: string | null;
};

export type WahaSession = {
  name: string;
  status: string;
  me?: WahaSessionMe | null;
};

export type WahaMessage = {
  // Composite id: `<fromMe>_<chatId>_<waMessageId>[_<participant>]`.
  id: string;
  // Unix SECONDS.
  timestamp: number;
  from: string;
  to?: string | null;
  participant?: string | null;
  fromMe: boolean;
  body?: string | null;
  hasMedia?: boolean;
  ack?: number | null;
  ackName?: string | null;
  replyTo?: { id?: string } | null;
};

// `/chats/overview` returns exactly these keys — notably there is no unread
// counter anywhere in the WAHA API, and no `isGroup` flag.
export type WahaChatOverview = {
  id: string;
  name?: string | null;
  picture?: string | null;
  lastMessage?: WahaMessage | null;
};

export type WahaLidMapping = {
  lid: string;
  pn: string;
};

export type WahaSendTextParams = {
  sessionName: string;
  chatId: string;
  text: string;
  // Composite id of the message being answered, when this is a reply.
  replyToMessageId?: string;
};
