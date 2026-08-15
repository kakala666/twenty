# Fork-local changes

This repo is a private fork of `twentyhq/twenty`. Nothing is submitted upstream; upstream is
pulled down periodically. Every change below has to survive that merge, so the rule is:
**add new files, and when an upstream file must change, keep it to a single-line insertion.**

Find every fork commit with `git log --oneline --grep='\[fork\]'`.

## New directories (upstream never touches these — zero conflict risk)

| Path | What |
|---|---|
| `packages/twenty-server/src/modules/whatsapp/` | WhatsApp sync module (mirrors `modules/messaging/`) |
| `packages/twenty-apps/internal/whatsapp/` | The WhatsApp app: objects, fields, indexes, views, nav |

## Upstream files modified

*(none yet — this table is filled in as the sync module gets registered)*

Planned, each a single-line insertion into a list:

| File | Change |
|---|---|
| `packages/twenty-server/src/modules/modules.module.ts` | add `WhatsappModule` to `imports` |
| `packages/twenty-server/src/engine/core-modules/message-queue/jobs.module.ts` | add `WhatsappModule` to `imports` so the worker discovers its `@Processor`s |
| `packages/twenty-server/src/engine/core-modules/core-engine.module.ts` | add `WhatsappWebhooksModule` |
| `packages/twenty-server/src/database/commands/database-command.module.ts` | add `WhatsappModule` so cron commands are injectable |
| `packages/twenty-server/src/database/commands/cron-register-all.command.ts` | constructor param + one `allCommands` entry |

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
