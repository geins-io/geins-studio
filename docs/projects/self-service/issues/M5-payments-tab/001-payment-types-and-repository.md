---
title: 'Add ChannelPayment types and payment endpoints to channel repository'
project: 'Self Service (Channels)'
milestone: 'M5 — Payments Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - '../M1-foundation/002-channel-api-repository.md'
model: sonnet
mode: claude-code agent
---

## Context

The Payments tab needs types and API methods before any UI can be built. The project plan specifies three payment endpoints on the channel repository, a `ChannelPayment` response type with nested market/customer type info, and an `active` boolean that is toggled via the single `PATCH /account/channel/{id}` write surface.

## Expected Outcome

- `shared/types/Channel.ts` contains `ChannelPayment`, `ChannelPaymentUpdate`, and related sub-types.
- `ChannelResponse.paymentMethods` is typed as `ChannelPayment[]`.
- `ChannelUpdate.paymentMethods` is typed as `ChannelPaymentUpdate[]`.
- The channel repository exposes three payment methods reachable via `useGeinsRepository().channelApi`.

## Implementation Notes

### Types (`shared/types/Channel.ts`)

```ts
interface ChannelPaymentMarket {
  _id: string
  name: string
}

interface ChannelPaymentCustomerType {
  _id: string
  name: string
}

interface ChannelPaymentCustomerGroup {
  _id: string
  name: string
}

interface ChannelPayment {
  _id: string
  _type: string
  name: string
  icon?: string | null
  markets: ChannelPaymentMarket[]
  customerTypes: ChannelPaymentCustomerType[]
  customerGroups: ChannelPaymentCustomerGroup[]
  active: boolean
}

interface ChannelPaymentUpdate {
  paymentId: string
  active: boolean
}
```

- Extend `ChannelResponse` with `paymentMethods: ChannelPayment[]`.
- Extend `ChannelUpdate` with `paymentMethods?: ChannelPaymentUpdate[]`.

### Repository (`app/utils/repositories/channel.ts`)

Add three payment methods following the existing market endpoint pattern in the same file:

- `listAllPayments()` → `GET /account/payment/list` — all payment methods available in the system (source for display; channel PATCH controls which are active).
- `listPayments(channelId: string)` → `GET /account/channel/{channelId}/payment/list` — payments for a specific channel.
- `getPayment(channelId: string, paymentId: string)` → `GET /account/channel/{channelId}/payment/{paymentId}` — single payment detail.

The existing `globalApi.language.list()` in `globalRepo` serves as the structural reference for how read-only list endpoints are shaped. Payment endpoints follow the same `/account/` prefix convention established for all channel API calls.

No new registration in `useGeinsRepository.ts` is needed if the methods are added to the existing `channelApi` export.

## Acceptance Criteria

- `ChannelPayment`, `ChannelPaymentUpdate`, and the three sub-types are defined in `shared/types/Channel.ts` and exported.
- `ChannelResponse.paymentMethods` is `ChannelPayment[]`.
- `ChannelUpdate.paymentMethods` is `ChannelPaymentUpdate[]`.
- `channelApi.listAllPayments()`, `channelApi.listPayments(id)`, and `channelApi.getPayment(channelId, paymentId)` are callable from the repository.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: test that `ChannelPayment` objects are assignable to the type (structural type check); test that `ChannelPaymentUpdate` enforces `paymentId: string` and `active: boolean`.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Requires understanding the existing repository factory chain and type conventions across multiple files, but carries no logic risk — sonnet handles this confidently.
