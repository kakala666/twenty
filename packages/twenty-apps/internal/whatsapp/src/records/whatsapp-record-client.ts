import { CoreApiClient } from 'twenty-client-sdk/core';

import { isDefined, isNonEmptyString } from 'src/utils/type-guards.util';

// The generated `CoreApiClient` shipped with the SDK only knows the standard
// schema; the workspace-specific client injected into the function runtime also
// knows this app's objects. Selections for `whatsappChat` & co. therefore have
// no compile-time type here, so the client is narrowed to an untyped genql
// surface and every result is validated through the readers below instead.
type GenqlSelection = Record<string, unknown>;

type UntypedCoreApiClient = {
  query: (request: GenqlSelection) => Promise<Record<string, unknown>>;
  mutation: (request: GenqlSelection) => Promise<Record<string, unknown>>;
};

const getCoreApiClient = (): UntypedCoreApiClient =>
  new CoreApiClient() as unknown as UntypedCoreApiClient;

const readEdges = (
  result: Record<string, unknown>,
  connectionName: string,
): Record<string, unknown>[] => {
  const connection = result[connectionName] as
    | { edges?: { node?: Record<string, unknown> }[] }
    | undefined;

  return (connection?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is Record<string, unknown> => isDefined(node));
};

const readString = (
  record: Record<string, unknown>,
  key: string,
): string | null => (isNonEmptyString(record[key]) ? record[key] : null);

const readRequiredId = (
  record: Record<string, unknown> | undefined,
  context: string,
): string => {
  const id = isDefined(record) ? readString(record, 'id') : null;

  if (!isDefined(id)) {
    throw new Error(`[whatsapp] ${context} returned no record id.`);
  }

  return id;
};

// A null in a patch means "the source did not report this", never "clear it" —
// a partial payload must not blank an address we already resolved.
const withoutNullish = (input: Record<string, unknown>): GenqlSelection =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => isDefined(value)),
  );

export type WhatsappAccountRecord = {
  id: string;
  sessionName: string | null;
  displayName: string | null;
};

export type WhatsappChatRecord = {
  id: string;
  chatId: string | null;
  phoneJid: string | null;
  lid: string | null;
  accountId: string | null;
  accountSessionName: string | null;
};

export type WhatsappMessageRecord = {
  id: string;
  externalId: string | null;
  ackStatus: string | null;
};

const ACCOUNT_NODE_SELECTION = {
  id: true,
  sessionName: true,
  displayName: true,
} as const;

const CHAT_NODE_SELECTION = {
  id: true,
  chatId: true,
  phoneJid: true,
  lid: true,
  accountId: true,
  account: { sessionName: true },
} as const;

const MESSAGE_NODE_SELECTION = {
  id: true,
  externalId: true,
  ackStatus: true,
} as const;

const toAccountRecord = (
  node: Record<string, unknown>,
): WhatsappAccountRecord => ({
  id: readRequiredId(node, 'whatsappAccount query'),
  sessionName: readString(node, 'sessionName'),
  displayName: readString(node, 'displayName'),
});

const toChatRecord = (node: Record<string, unknown>): WhatsappChatRecord => {
  const account = node.account as Record<string, unknown> | null | undefined;

  return {
    id: readRequiredId(node, 'whatsappChat query'),
    chatId: readString(node, 'chatId'),
    phoneJid: readString(node, 'phoneJid'),
    lid: readString(node, 'lid'),
    accountId: readString(node, 'accountId'),
    accountSessionName: isDefined(account)
      ? readString(account, 'sessionName')
      : null,
  };
};

const toMessageRecord = (
  node: Record<string, unknown>,
): WhatsappMessageRecord => ({
  id: readRequiredId(node, 'whatsappMessage query'),
  externalId: readString(node, 'externalId'),
  ackStatus: readString(node, 'ackStatus'),
});

export type WhatsappAccountInput = {
  sessionName: string;
  displayName: string;
  phoneNumber: string | null;
  lid: string | null;
  status: string | null;
  lastSyncedAt: string;
};

export type WhatsappChatInput = {
  chatId: string;
  name: string;
  phoneJid?: string | null;
  lid?: string | null;
  isGroup?: boolean;
  lastMessageAt?: string | null;
  accountId?: string | null;
};

export type WhatsappChatPatch = Partial<Omit<WhatsappChatInput, 'chatId'>> & {
  chatId?: string;
};

export type WhatsappMessageInput = {
  externalId: string;
  waMessageId: string;
  text: string | null;
  sentAt: string;
  direction: 'INBOUND' | 'OUTBOUND';
  ackStatus: string;
  senderId: string | null;
  senderName: string | null;
  replyToExternalId: string | null;
  hasMedia: boolean;
  mediaMimeType: string | null;
  rawPayload: unknown;
  whatsappChatId: string;
};

export const findWhatsappAccountBySessionName = async (
  sessionName: string,
): Promise<WhatsappAccountRecord | null> => {
  const result = await getCoreApiClient().query({
    whatsappAccounts: {
      __args: { filter: { sessionName: { eq: sessionName } }, first: 1 },
      edges: { node: ACCOUNT_NODE_SELECTION },
    },
  });

  const node = readEdges(result, 'whatsappAccounts')[0];

  return isDefined(node) ? toAccountRecord(node) : null;
};

export const findFirstWhatsappAccount =
  async (): Promise<WhatsappAccountRecord | null> => {
    const result = await getCoreApiClient().query({
      whatsappAccounts: {
        __args: { first: 1 },
        edges: { node: ACCOUNT_NODE_SELECTION },
      },
    });

    const node = readEdges(result, 'whatsappAccounts')[0];

    return isDefined(node) ? toAccountRecord(node) : null;
  };

export const upsertWhatsappAccount = async (
  input: WhatsappAccountInput,
): Promise<WhatsappAccountRecord> => {
  const existing = await findWhatsappAccountBySessionName(input.sessionName);

  if (isDefined(existing)) {
    await getCoreApiClient().mutation({
      updateWhatsappAccount: {
        __args: { id: existing.id, data: input },
        id: true,
      },
    });

    return { ...existing, displayName: input.displayName };
  }

  const result = await getCoreApiClient().mutation({
    createWhatsappAccount: { __args: { data: input }, ...ACCOUNT_NODE_SELECTION },
  });

  return toAccountRecord(
    (result.createWhatsappAccount ?? {}) as Record<string, unknown>,
  );
};

// Chats are keyed by `@c.us` but messages address the same peer as `@lid`, so a
// lookup has to try every address the peer is known under.
export const findWhatsappChatByAddresses = async (
  addresses: readonly string[],
): Promise<WhatsappChatRecord | null> => {
  const uniqueAddresses = [...new Set(addresses.filter(isNonEmptyString))];

  if (uniqueAddresses.length === 0) {
    return null;
  }

  const result = await getCoreApiClient().query({
    whatsappChats: {
      __args: {
        filter: {
          or: [
            { chatId: { in: uniqueAddresses } },
            { phoneJid: { in: uniqueAddresses } },
            { lid: { in: uniqueAddresses } },
          ],
        },
        first: 1,
      },
      edges: { node: CHAT_NODE_SELECTION },
    },
  });

  const node = readEdges(result, 'whatsappChats')[0];

  return isDefined(node) ? toChatRecord(node) : null;
};

export const createWhatsappChat = async (
  input: WhatsappChatInput,
): Promise<WhatsappChatRecord> => {
  const result = await getCoreApiClient().mutation({
    createWhatsappChat: {
      __args: { data: withoutNullish(input) },
      ...CHAT_NODE_SELECTION,
    },
  });

  return toChatRecord(
    (result.createWhatsappChat ?? {}) as Record<string, unknown>,
  );
};

export const updateWhatsappChat = async (
  id: string,
  patch: WhatsappChatPatch,
): Promise<void> => {
  const data = withoutNullish(patch);

  if (Object.keys(data).length === 0) {
    return;
  }

  await getCoreApiClient().mutation({
    updateWhatsappChat: { __args: { id, data }, id: true },
  });
};

export const findWhatsappMessagesByExternalIds = async (
  externalIds: readonly string[],
): Promise<WhatsappMessageRecord[]> => {
  const uniqueExternalIds = [...new Set(externalIds.filter(isNonEmptyString))];

  if (uniqueExternalIds.length === 0) {
    return [];
  }

  const result = await getCoreApiClient().query({
    whatsappMessages: {
      __args: {
        filter: { externalId: { in: uniqueExternalIds } },
        first: uniqueExternalIds.length,
      },
      edges: { node: MESSAGE_NODE_SELECTION },
    },
  });

  return readEdges(result, 'whatsappMessages').map(toMessageRecord);
};

export type CreateWhatsappMessageResult = {
  id: string;
  wasCreated: boolean;
};

// `whatsappMessage.externalId` carries a unique index, which is the real
// idempotency guarantee. Two deliveries of the same message can still race past
// a prior existence check, so a failed insert is re-resolved against the index
// instead of being reported as an error.
export const createWhatsappMessage = async (
  input: WhatsappMessageInput,
): Promise<CreateWhatsappMessageResult> => {
  try {
    const result = await getCoreApiClient().mutation({
      createWhatsappMessage: { __args: { data: input }, id: true },
    });

    return {
      id: readRequiredId(
        result.createWhatsappMessage as Record<string, unknown> | undefined,
        'createWhatsappMessage',
      ),
      wasCreated: true,
    };
  } catch (error) {
    const [alreadyStored] = await findWhatsappMessagesByExternalIds([
      input.externalId,
    ]);

    if (!isDefined(alreadyStored)) {
      throw error;
    }

    return { id: alreadyStored.id, wasCreated: false };
  }
};

export const updateWhatsappMessageAckStatus = async (
  id: string,
  ackStatus: string,
): Promise<void> => {
  await getCoreApiClient().mutation({
    updateWhatsappMessage: { __args: { id, data: { ackStatus } }, id: true },
  });
};
