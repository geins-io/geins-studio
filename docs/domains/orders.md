# Orders Domain

> Quotation lifecycle management: create, send, negotiate, accept, confirm, finalize.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Orders domain manages the quotation-to-order workflow. Currently it covers quotations — B2B sales proposals that go through a multi-step lifecycle before becoming orders. The domain also includes basic order types for viewing company order history.

## Key Concepts

**Quotation lifecycle** — A quotation progresses through a state machine:

```
requestDraft → requested ─┐            (buyer requests)
                          ↓ send
               draft → pending → accepted → confirmed → finalized
                               ↘ expired      ↘ canceled
                               ↘ rejected
```

All status transitions are one-way (no revert to draft). Each transition is a `POST /quotation/{id}/{action}` with a `StatusTransitionRequest` body. The `expire` transition is automatic (never triggered manually).

**Buyer requests** — A buyer can ask for a quotation from the sales portal. While they write it, the quotation is `requestDraft` and only the buyer edits it. Once they send it, it becomes `requested` and it is the seller's turn: `send` moves it to `pending`, and `reject`/`cancel` are allowed too. What the buyer sent is on `quotation.request`, shown read-only by `QuotationRequestDetails` in both General layouts; its `requestedValidTo` is only a wish (it never sets `validTo`), shown as a hint under the Expiration date field while editing.

**`requestDraft` is never shown in Studio** — `orderApi.quotation.list()` excludes it server-side by default (`VISIBLE_QUOTATIONS_QUERY` in `app/utils/repositories/order.ts`). The API ignores `exclude` when `all: true` is set and only subtracts `exclude` from an `include`. So the query includes every quotation with `hasExternalReference: true OR false` and excludes `statuses: ['requestDraft']`. It doesn't list the allowed statuses, so statuses the API adds later still show up. A caller that passes its own batch query to `list()` or `query()` must exclude request drafts the same way.

**Snapshots** — When a quotation is created, the API captures point-in-time snapshots of the company (`QuotationCompany`), owner/sales rep (`QuotationOwner`), and buyer (`QuotationCustomer`). Each snapshot extends `EntitySnapshot` with `_id`, `_type`, `_snapshotAt`. Read IDs via `company._id`, `owner._id`, `customer._id` (not `companyId`/`ownerId`). Owner and customer use `firstName`/`lastName` (no combined `name` or `email`). Addresses use the standard `Address` type.

**Items** — `QuotationUpdate.items` accepts `QuotationItemCreate[]` (shape: `{ skuId, quantity, unitPrice? }`), not the response item type. The response `QuotationItem` includes enriched fields: `ordPrice`, `listPrice`, `name`, `articleNumber`, `primaryImage`.

**Live preview** — `POST /quotation/{id}/preview` calculates totals without persisting. Only available in draft edit mode. Returns `{ items, total }` where items are enriched with `ordPrice`/`listPrice` from applied price lists. `unitPrice` is never overwritten from the preview response. **Infinite loop prevention**: Do NOT watch `quotationItems` to trigger preview — the preview response updates `skuItemData` (ordPrice/listPrice), which changes `quotationItems` output, creating a loop. Trigger from explicit user-action handlers instead.

**Sent mode** — Three mutually exclusive modes: `createMode` (route param `new`), draft (editable) mode, and sent (read-only) mode. `isQuotationEditable()` (`shared/utils/quotation.ts`) is the one rule: `draft` and `requested` are editable, every other status is read-only. `sentMode` is a `ref<boolean>` set from it in `parseEntityData` on every load — never reverts since transitions are one-way. In sent mode, General tab renders read-only cards; Products tab is replaced by Communications tab. Status transitions use `POST /quotation/{id}/{action}` → `refreshEntityData()` to update all UI state.

**Requested quotations** — Edited exactly like a draft (same form, PATCH, `sendBlockReasons` and send dialog); the Save button reads "Save quotation" instead of "Save draft", and the dropdown adds **Cancel quotation** (declines the request). The API's `reject` from `requested` is the buyer withdrawing it, so Studio doesn't offer it. Requests often arrive without terms, owner or `validTo`: the form shows them empty (no `Net 30` fallback) so Send stays blocked until the seller sets them. `QuotationWorkflowInfo` starts its flow at Requested. A `requestDraft` opened by URL throws the standard 404 via `usePageError().throwPageError(404)`.

**Communications** — Messages (`QuotationMessage`) are typed as `internal`, `toCustomer`, or `fromCustomer`. CRUD via `/quotation/{id}/message` (create) and `/quotation/message/{messageId}` (update/delete). All message mutations require re-fetching the quotation. `QuotationMessageCreate`: `{ type, authorId, authorName, message, answerRef? }`. `QuotationMessageUpdate`: `{ type?, message?, answerRef? }`.

**Currency default in create mode** — When a company is selected, the currency auto-defaults to the channel's default market currency (via `channel.defaultMarket` → market lookup → `market.currency._id`), falling back to `availableCurrencies[0]`.

**Deletable statuses** — Delete is available for `draft`, `requested`, `rejected`, `expired`, and `canceled` quotations. Statuses like `pending`, `accepted`, `confirmed`, and `finalized` do not allow deletion.

**Changelog** — `changelogApi.getForEntity('quotation', id)` fetches changelog entries. `ChangelogEntry.id` is a `number` from the API (typed as `string | number`). Entries with `subEntity === 'message'` are filtered out (messages are shown separately). The `changes` field is a JSON string of `[{ p: string, c: string[] }]`.

## API Shape Quirks

**`validPaymentMethods`** — Response: `{ paymentId: number, name: string }`. Request: `{ paymentId: string }` (string, no `name`).

**`validShippingMethods`** — Response: `{ shippingId: number, name: string, shippingFee: number }`. Request: `{ shippingId: string, shippingFee?: number }`.

**`quotationNumber`** — Read-only, auto-generated by the backend. Not accepted on PATCH.

**`discount`** — Optional `{ type: 'fixedAmount' | 'percent', value: number }`. Accepted by both PATCH and preview endpoints.

**`settings`** — `{ requireConfirmation?: boolean }`. Controls whether the workflow requires an explicit confirmation step.

**`terms`** — Plain `string` on create/update. Response returns `string` (not `{ text: string }` as previously documented).

**`QuotationTotal` shape** — `{ subtotal, discount, shipping, margin, vat, grandTotalExVat, grandTotalIncVat }` — all `number`. Note: field is `vat` (not `tax`), and grand total is split into ex-VAT and inc-VAT variants.

**`QuotationCompany.vatNumber`** — The company snapshot uses `vatNumber` (not `orgNr`).

**`QuotationStatus` casing** — Status values are camelCase as the API sends them: single words are lowercase (`'draft'`, `'pending'`, `'requested'`), and the one compound is `'requestDraft'`.

**`request`, `orderDetails`, `externalReference`, `orderPublicId`** — Omitted from the response when empty. `QuotationRequest`, `QuotationOrderDetails` and `QuotationExternalReference` are value objects with no `_id`/`_type`. The list page keeps them on the row data but excludes them as columns.

**`prepareUpdateData` must NOT spread** — `entityDataUpdate` contains response-only fields (`billingAddress`, `shippingAddress`, `total`, `company`, `owner`, `customer`, `communication`, `changelog`). Only include OpenAPI update schema fields: `name`, `validTo`, `companyId`, `ownerId`, `customerId`, `validPaymentMethods`, `validShippingMethods`, `suggestedShippingFee`, `terms`, `billingAddressId`, `shippingAddressId`, `items`.

**OpenAPI spec**: `https://geins-func-quotation-mgmtapi-dev.azurewebsites.net/api/openapi/v3.json`

## Contracts (Cross-Domain Usage)

| Type                         | Used By                   | Purpose                           |
| ---------------------------- | ------------------------- | --------------------------------- |
| `Quotation`, `QuotationList` | List/detail pages         | Core quotation display            |
| `QuotationTotal`             | Price summary component   | Totals display and preview        |
| `QuotationProductRow`        | Products tab table        | Flat row type for quotation items |
| `StatusTransitionRequest`    | Status transition dialogs | Action payloads                   |
| `Order`, `CustomerOrder`     | Customers                 | Company order history             |

## Dependencies

- **Depends on**: Customers (company, buyer, addresses), Products (SKU selection), Pricing (price lists for item pricing)
- **Depended on by**: None (leaf domain in the dependency graph)

## Key Files

| Layer       | Path                                                 |
| ----------- | ---------------------------------------------------- |
| Types       | `shared/types/Order.ts`, `shared/types/Quotation.ts` |
| Repository  | `app/utils/repositories/order.ts`                    |
| Composables | `useCompanyOrders.ts`                                |
| Components  | `app/components/quotation/`                          |
| Pages       | `app/pages/orders/quotations/index.vue`, `[id].vue`  |

## Decision Log

**2025-09-01: Snapshot pattern for quotation sub-entities**
Company, owner, and buyer data are captured as snapshots at quotation creation time. This preserves the state that was current when the quote was issued, even if the source entity changes later.

**2025-10-01: Separate quotation microservice**
The quotation API runs as an independent service (`/quotation/*`) with its own OpenAPI spec. This allows the quotation lifecycle to evolve independently from the order service.

**2025-11-01: Preview endpoint for live total calculation**
`POST /quotation/{id}/preview` calculates totals without persisting, enabling real-time feedback as users edit items, discounts, and shipping fees. Prevents the need to save-and-reload for every change.
