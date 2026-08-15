# Fork-local changes

This repo is a private fork of `twentyhq/twenty`. Nothing is submitted upstream; upstream is
pulled down periodically. Every change below has to survive that merge, so the rule is:
**add new files, and when an upstream file must change, keep it to a single-line insertion.**

Find every fork commit with `git log --oneline --grep='\[fork\]'`.

## New directories (upstream never touches these — zero conflict risk)

| Path | What | Status |
|---|---|---|
| `packages/twenty-apps/internal/whatsapp/` | The WhatsApp app: objects, fields, indexes, views, nav, and the sync logic functions | **This is what ships.** Installed on the live instance. |
| `packages/twenty-server/src/modules/whatsapp/` | The same sync primitives as a core NestJS module | **Not wired.** See below. |

## Upstream files modified

**None.** The whole feature ships as an app, so there is currently nothing to merge.

That is the point of the app route: objects, views, navigation and the sync logic functions all
travel in the app manifest and are pushed over the API at runtime, so no container image is rebuilt
and no upstream file is touched.

## Why there are two copies of the sync logic

The pure primitives (WAHA event parsing, JID/LID identity, backfill windowing, the HTTP client) were
built test-first under `packages/twenty-server/src/modules/whatsapp/` with jest, before it was clear
that the app route could carry the whole feature. They were then ported into the app, where they run.

The `twenty-server` copy is therefore **currently dead code**. It is kept, not deleted, because it is
the ready-made starting point if the feature ever outgrows logic functions and needs the core route —
BullMQ queues, per-chat mutexes and worker-grade retries. It costs nothing to keep: it is a new
directory upstream never touches. **If we commit to the app route for good, delete it** rather than
maintain two sources of truth.

Registering it later would mean these single-line insertions:

| File | Change |
|---|---|
| `packages/twenty-server/src/modules/modules.module.ts` | add `WhatsappModule` to `imports` |
| `packages/twenty-server/src/engine/core-modules/message-queue/jobs.module.ts` | add `WhatsappModule` so the worker discovers its `@Processor`s |
| `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` | add `WhatsappWebhooksModule` |
| `packages/twenty-server/src/database/commands/database-command.module.ts` | add `WhatsappModule` so cron commands are injectable |
| `packages/twenty-server/src/database/commands/cron-register-all.command.ts` | constructor param + one `allCommands` entry |

## Deployment settings that are NOT defaults

These live in `/opt/twenty/deploy/.env` on the server, not in this repo, but they are load-bearing:

- `LOGIC_FUNCTION_TYPE=LOCAL` — **required**. In production `NODE_ENV`, Twenty defaults this to
  `DISABLED`, and every logic function silently never runs.
- The app's `WAHA_BASE_URL` / `WAHA_API_KEY` / `WAHA_WEBHOOK_SECRET` are set as *server variables on
  the application registration* (Settings → Applications → Developer → the app → 配置), not as
  container env vars. Logic functions receive only what the executor injects, so `process.env` from
  the container does not reach them.

## Deliberately NOT done

- **No new standard objects.** Adding one means editing ~20 upstream files, including the
  `satisfies Record<AllStandardObjectName, …>` maps in `twenty-shared` that upstream edits every
  time *they* add an object. The WhatsApp data model is therefore defined by the app manifest as
  custom objects instead, which costs zero upstream files.
- **No fork of WAHA.** It runs as a pinned upstream image and is treated as infrastructure, like
  Postgres or Redis.

## Known upstream breakage worked around

- `twenty-sdk`'s `build:sdk` script passes single-quoted globs to `rimraf`
  (`npx rimraf 'dist/sdk' 'dist/define/**/*.d.ts' …`). On Windows the shell does not strip the
  quotes, so rimraf receives a path containing `'` and fails with `EINVAL: Illegal characters in
  path`. Consequence: **the frontend cannot be built on Windows.** Build container images on Linux.
  Not patched here, because patching it would touch an upstream file for a local-only annoyance.

## Regenerable, never hand-merge

`packages/twenty-front-component-renderer/src/{host,remote}/generated/*` are git-tracked but
generated. On conflict, re-run:

```
npx nx run twenty-front-component-renderer:generate-remote-dom-elements
```
