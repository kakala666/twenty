# WhatsApp

Syncs WhatsApp conversations into the CRM through a self-hosted
[WAHA](https://waha.devlike.pro) instance.

This package contains the data model (objects, fields, relations, indexes,
views, the navigation entry, the default application role) and the **sync
layer**: a webhook receiver, a chat/account sync cron and a send endpoint.
Front components are out of scope here.

## Data model

| Object            | Label identifier | Purpose                                              |
| ----------------- | ---------------- | ---------------------------------------------------- |
| `whatsappAccount` | `displayName`    | One connected WhatsApp number, i.e. one WAHA session |
| `whatsappChat`    | `name`           | One conversation (1:1 or group)                      |
| `whatsappMessage` | `externalId`     | One message                                          |

Relations:

- `whatsappChat.account` → `whatsappAccount` (MANY_TO_ONE, `accountId`, CASCADE),
  inverse `whatsappAccount.chats`
- `whatsappChat.person` → `person` (MANY_TO_ONE, `personId`, SET_NULL, nullable),
  inverse `person.whatsappChats`
- `whatsappChat.company` → `company` (MANY_TO_ONE, `companyId`, SET_NULL,
  nullable), inverse `company.whatsappChats`
- `whatsappMessage.whatsappChat` → `whatsappChat` (MANY_TO_ONE,
  `whatsappChatId`, CASCADE), inverse `whatsappChat.messages`

The message join column is named `whatsappChatId` rather than `chatId` because
`chatId` is already the TEXT field holding the raw WAHA chat id.

Indexes:

- unique on `whatsappMessage.externalId` — the idempotency key for ingestion
- on `whatsappMessage.sentAt`
- on `whatsappChat.chatId`

`whatsappMessage.rawPayload` (RAW_JSON) keeps channel-specific extras verbatim,
so new WhatsApp features do not require a schema change.

## Sync layer

| Logic function          | Trigger                        | What it does                                                    |
| ----------------------- | ------------------------------ | --------------------------------------------------------------- |
| `whatsapp-webhook`      | `POST /whatsapp/webhook`, public | Ingests `message`, `message.any` and `message.ack` deliveries   |
| `whatsapp-sync-chats`   | cron `*/15 * * * *`            | Refreshes accounts and chats (no message history)                |
| `whatsapp-send-message` | `POST /whatsapp/send`, authenticated | Sends a text through WAHA and records the outbound message |

The webhook's public URL is `https://<server>/s/whatsapp/webhook`.

Because it is unauthenticated it verifies the caller itself, in this order:

1. `X-Waha-Webhook-Secret` (a WAHA `customHeaders` entry) compared in constant
   time against `WAHA_WEBHOOK_SECRET`;
2. otherwise `X-Webhook-Hmac`, the HMAC-SHA512 of the **raw** request body keyed
   with the same secret. The raw body is optional on the route payload; when a
   signature is present but the raw body is not, the delivery is rejected with a
   distinct log line rather than compared against a re-serialized body, which
   could only ever produce a false reject.

⚠ If `WAHA_WEBHOOK_SECRET` is unset the endpoint accepts everything and logs a
warning on each delivery. That is deliberate, so the integration can be wired up
before the secret exists — set the secret as soon as the URL is public.

Ingestion is idempotent: `whatsappMessage.externalId` carries a unique index and
is also checked before insert, so a repeat delivery (WAHA emits both `message`
and `message.any` for inbound traffic) is a no-op. Ack status only ever moves
forward through `UNKNOWN < PENDING < SERVER < DEVICE < READ < PLAYED`, because
WhatsApp does not deliver ack events in order.

## Server variables

| Name                  | Required | Secret | Purpose                                       |
| --------------------- | -------- | ------ | --------------------------------------------- |
| `WAHA_BASE_URL`       | yes      | no     | Base URL of the self-hosted WAHA instance     |
| `WAHA_API_KEY`        | yes      | yes    | Key sent to WAHA in the `X-Api-Key` header    |
| `WAHA_WEBHOOK_SECRET` | no       | yes    | Shared secret authenticating inbound webhooks |
| `WAHA_SESSION_NAME`   | no       | no     | Session used when a chat has no account yet   |

The server's logic-function executor decrypts each declared server variable and
merges it into the sandbox environment under its own key, so a logic function
reads them from `process.env`. `src/utils/read-application-variable.util.ts`
wraps that, first checking the `process.env.applicationVariables` JSON blob the
SDK's front-component accessor uses, then the plain environment variable.

## Tests

```bash
npx vitest run
```

Pure logic lives in `src/utils/` and is covered there; the logic functions
themselves stay thin (parse input, call a handler, return a `Response`).

## Build and install

This app is a standalone yarn project, but inside this fork it resolves
`twenty-sdk` / `twenty-client-sdk` from the monorepo root `node_modules`
(both are yarn workspaces there), so no `yarn install` is required in this
directory. Run the fork's own CLI build:

```bash
# from the repository root
node packages/twenty-sdk/dist/cli.cjs dev:build packages/twenty-apps/internal/whatsapp
```

To deploy and install onto a running server:

```bash
node packages/twenty-sdk/dist/cli.cjs remote:add \
  --as prod --url https://crm.aishop.fun --api-key "$TWENTY_API_KEY"

node packages/twenty-sdk/dist/cli.cjs app:publish \
  packages/twenty-apps/internal/whatsapp --private -r prod

node packages/twenty-sdk/dist/cli.cjs app:install \
  packages/twenty-apps/internal/whatsapp -r prod
```

`app:publish --private` rejects a redeploy at the same version, so bump
`version` in `package.json` before each redeploy.

## Universal identifiers

Every `universalIdentifier` lives in `src/constants/universal-identifiers.ts`.
They are the stable cross-environment keys the app sync matches on — never edit
one after the app has been installed anywhere.
