---
title: 'Create Channel API repository and register it'
project: 'Self Service (Channels)'
milestone: 'M1 — Foundation'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './001-channel-types.md'
model: sonnet
mode: claude-code agent
---

## Context

All API access in Geins Studio flows through typed repository factories wired into `useGeinsRepository`. No channel repository exists yet. This issue creates the full channel repository and registers it so pages and composables can call channel and market/language/payment endpoints.

The backend API is not yet live (backend M1 in progress), so the repository is built against the confirmed API contract — pages will integrate once the API is available.

## Expected Outcome

- `app/utils/repositories/channel.ts` exists with all confirmed endpoints.
- `app/utils/repos.ts` exports the channel repo.
- `useGeinsRepository` exposes `channelApi`.

## Implementation Notes

Follow the pattern from `app/utils/repositories/order.ts` — a factory function accepting `$Fetch` and returning a structured object with sub-namespaces.

### Base endpoint

All endpoints use `/account/` prefix.

### Channel endpoints

```ts
channel.list()           // GET /account/channel/list  → ChannelListItem[]
channel.get(id, opts?)   // GET /account/channel/{id}  → ChannelResponse
channel.create(data)     // POST /account/channel      → ChannelResponse
channel.update(id, data) // PATCH /account/channel/{id} — multipart/form-data
channel.activate(id)     // PUT /account/channel/{id}/activate  → void
channel.deactivate(id)   // PUT /account/channel/{id}/deactivate → void
```

**Critical — multipart/form-data for `update`**: The PATCH endpoint uses `multipart/form-data`. The JSON payload goes in a part named `"channel"`. File uploads (e.g. logo, header image) are separate parts named by their setting property key. Build a helper that constructs a `FormData` object from the `ChannelUpdate` payload, serialising non-file fields into the `"channel"` JSON part and attaching any `File` values as named file parts.

### Market endpoints

```ts
market.listAll()         // GET /account/market/list            → ChannelMarket[]
market.listForChannel(channelId) // GET /account/channel/{id}/market/list → ChannelMarket[]
```

### Language endpoints

```ts
language.listAll()       // GET /account/language/list          → ChannelLanguage[]
language.get(id)         // GET /account/language/{id}          → ChannelLanguage
```

### Payment endpoints

```ts
payment.listAll()        // GET /account/payment/list           → ChannelPaymentMethod[]
payment.listForChannel(channelId) // GET /account/channel/{id}/payment/list → ChannelPaymentMethod[]
payment.get(channelId, paymentId) // GET /account/channel/{id}/payment/{paymentId} → ChannelPaymentMethod
```

### Mail endpoints

```ts
mail.getTexts(channelId, mailType, language)         // GET /account/channel/{id}/mail/{type}?language={lang}
mail.updateTexts(channelId, mailType, data)          // PATCH /account/channel/{id}/mail/{type}
mail.preview(channelId, mailType, language)          // POST /account/channel/{id}/mail/{type}/preview
```

### Registration

In `app/utils/repos.ts`, add `channelRepo` to the `repo` object.
In `app/composables/useGeinsRepository.ts`, add `channelApi: repo.channel($geinsApiFetchInstance)` and extend the return type interface.

## Acceptance Criteria

- `app/utils/repositories/channel.ts` exists and exports `channelRepo`.
- All endpoints listed above are implemented with correct HTTP methods, paths, and TypeScript types.
- The `update` method correctly constructs `multipart/form-data` with the JSON part named `"channel"` and file parts named by their setting key.
- `channel.activate` and `channel.deactivate` use `PUT` (not `PATCH`).
- `app/utils/repos.ts` exports `channelRepo` via `repo.channel`.
- `useGeinsRepository` returns `channelApi` and the return type interface is updated.
- `pnpm typecheck` passes with no new errors.
- No `console.log` — use `useGeinsLog` if logging is needed.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard repository factory pattern with a non-trivial multipart/form-data helper — within sonnet's capability following existing patterns.
