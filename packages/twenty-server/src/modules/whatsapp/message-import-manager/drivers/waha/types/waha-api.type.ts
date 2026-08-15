// Nest injection token for the WAHA connection settings. WAHA is self-hosted,
// so the base URL and key are deployment-level settings supplied by the module
// that wires this client up rather than per-record credentials.
export const WAHA_API_CLIENT_OPTIONS = 'WAHA_API_CLIENT_OPTIONS';

export type WahaApiClientOptions = {
  baseUrl: string;
  apiKey: string;
};

export type WahaSession = {
  name: string;
  status: string;
};

export type WahaChat = {
  id: string;
  name: string | null;
  // Unix SECONDS, unlike the millisecond timestamp on event envelopes.
  conversationTimestamp: number | null;
};

// The overview endpoint exposes exactly these keys — notably there is no unread
// counter anywhere in the WAHA API.
export type WahaChatOverview = {
  id: string;
  name: string | null;
  picture: string | null;
  lastMessage: WahaMessage | null;
};

export type WahaMessage = {
  // Composite id: `<fromMe>_<chatId>_<waMessageId>[_<participant>]`.
  id: string;
  // Unix SECONDS.
  timestamp: number;
  from: string;
  to: string | null;
  participant?: string | null;
  fromMe: boolean;
  body: string | null;
  hasMedia?: boolean;
  ack: number | null;
  ackName: string | null;
  replyTo: { id: string } | null;
};

export type WahaPaginationParams = {
  limit?: number;
  offset?: number;
};

export type WahaSendTextParams = {
  sessionName: string;
  chatId: string;
  text: string;
  // Composite id of the message being answered, when this is a reply.
  replyToMessageId?: string;
};

export type WahaGetChatMessagesParams = {
  sessionName: string;
  chatId: string;
  // Both bounds are unix SECONDS, matching `filter.timestamp.*` on the wire.
  gteInSeconds?: number;
  lteInSeconds?: number;
  downloadMedia?: boolean;
} & WahaPaginationParams;
