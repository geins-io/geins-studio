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

**Order details** — `quotation.orderDetails` holds what goes onto the order when the quotation is finalized: `goodsLabel`, `customerOrderNumber` (the buyer's PO number or reference, labelled **PO number / reference** as in the Sales Portal) and `desiredDeliveryDate`. The API also has `customerReference`, kept on the quotation only; Studio doesn't use it, and `customerOrderNumber` is the one field for the buyer's reference. At checkout the buyer can't change them, and copy doesn't carry them over: a PO number belongs to one order. Where they come from decides how Studio shows them (`canEditOrderDetails()` in `shared/utils/quotation.ts`):

- **A buyer's request** brings them. The quotation shows them only in **Request details** (`QuotationRequestDetails`), read-only in every status, in place of the order details card, so nothing shows twice. A requested quotation never goes back to `draft`, so they're never edited.
- **A draft the seller created** (no request, not external) gets an editable **Order details** card between Quotation details and Customer (`QuotationOrderDetailsFields`). It's part of the form, and its changes go out with the draft's normal PATCH as `orderDetails`. The create step leaves it out: the seller fills it in once the draft exists.
- **Once that draft is sent** (`pending` and later), or when an external system owns the quotation, they're locked: the read-only **Order details** card (`QuotationOrderDetailsCard`) shows them in the same place, with no edit action.

Editing them on a draft:

- **Changes only** — `orderDetailsRequest(values, stored)` sends just the fields that are set and differ from the stored ones; the API keeps any field left out. With nothing to send it returns `undefined`, because the API refuses an empty `orderDetails`. `reshapeEntityData` therefore sets `orderDetails: undefined`, so the unsaved-changes snapshot holds only the seller's pending changes, and the stored values live in the page's `storedOrderDetails` ref. Where they're locked (requested, sent, external), `parseEntityData` seeds the form fields empty and the schema gets no stored values, so nothing is validated or sent.
- **Replace, not clear** — the API can't clear a stored value. `createOrderDetailsSchema` (`app/utils/quotation-order-details.ts`) shows an error when the seller empties a field that has one, instead of silently keeping the old value. It also matches the API's limits: goods label 1–500, PO number / reference 1–30 characters, and a delivery date in the future (checked only when it changes, so an older stored date doesn't block saving).
- **Calendar days** — the delivery date names a day, not a moment, and the API takes it as that day at UTC midnight (`YYYY-MM-DDT00:00:00Z`). Converting local midnight to a UTC instant would move the order a day back in Sweden. `shared/utils/calendar-day.ts` holds the rule: a value at exactly UTC midnight is already a calendar day; any other instant names its local day. The form holds the day's local midnight (`calendarDayToLocalIso`) so `FormInputDate` shows the right day, and `toCalendarDayIso` turns it back for the request. `FormInputDate` itself is unchanged; `validTo` stays an instant.

**`requestDraft` is never shown in Studio** — `orderApi.quotation.list()` excludes it server-side by default (`VISIBLE_QUOTATIONS_QUERY` in `app/utils/repositories/order.ts`). The API ignores `exclude` when `all: true` is set and only subtracts `exclude` from an `include`. So the query includes every quotation with `hasExternalReference: true OR false` and excludes `statuses: ['requestDraft']`. It doesn't list the allowed statuses, so statuses the API adds later still show up. A caller that passes its own batch query to `list()` or `query()` must exclude request drafts the same way.

**Snapshots** — When a quotation is created, the API captures point-in-time snapshots of the company (`QuotationCompany`), owner/sales rep (`QuotationOwner`), and buyer (`QuotationCustomer`). Each snapshot extends `EntitySnapshot` with `_id`, `_type`, `_snapshotAt`. Read IDs via `company._id`, `owner._id`, `customer._id` (not `companyId`/`ownerId`). Owner and customer use `firstName`/`lastName` (no combined `name` or `email`). Addresses use the standard `Address` type.

**Items** — `QuotationUpdate.items` accepts `QuotationItemCreate[]` (shape: `{ skuId, quantity, unitPrice? }`), not the response item type. The response `QuotationItem` includes enriched fields: `ordPrice`, `listPrice`, `name`, `articleNumber`, `primaryImage`.

**Live preview** — `POST /quotation/{id}/preview` calculates totals without persisting. Only available in editable (draft/requested) mode. Returns `{ items, total }` where items are enriched with `ordPrice`/`listPrice` from applied price lists. `unitPrice` is never overwritten from the preview response. **Infinite loop prevention**: Do NOT watch `quotationItems` to trigger preview — the preview response updates `skuItemData` (ordPrice/listPrice), which changes `quotationItems` output, creating a loop. Trigger from explicit user-action handlers instead.

**Sent mode** — Three mutually exclusive modes: `createMode` (route param `new`), draft (editable) mode, and sent (read-only) mode. `isQuotationEditable()` (`shared/utils/quotation.ts`) is the one rule: `draft` and `requested` are editable, every other status is read-only. `sentMode` is a `ref<boolean>` set from it in `parseEntityData` on every load — never reverts since transitions are one-way. In sent mode, General tab renders read-only cards; Products tab is replaced by Communications tab. Status transitions use `POST /quotation/{id}/{action}` → `refreshEntityData()` to update all UI state. Nothing in sent mode goes through `useEntityEdit`'s update (the save button, the customer panel and the on-load snapshot re-save are draft/requested only): the API refuses it, and a full update that went through would rebuild the cart and reset the payment and shipping method the buyer chose at checkout.

**Requested quotations** — Edited exactly like a draft (same form, PATCH, `sendBlockReasons` and send dialog), except for the order details, which stay read-only in Request details; the Save button reads "Save quotation" instead of "Save draft", and the dropdown adds **Cancel quotation** (declines the request). The API's `reject` from `requested` is the buyer withdrawing it, so Studio doesn't offer it. Requests often arrive without terms, owner or `validTo`: the form shows them empty (no `Net 30` fallback) so Send stays blocked until the seller sets them. `QuotationWorkflowInfo` starts its flow at Requested. A `requestDraft` opened by URL throws the standard 404 via `usePageError().throwPageError(404)`.

**Communications** — Messages (`QuotationMessage`) are typed as `internal`, `toCustomer`, or `fromCustomer`. CRUD via `/quotation/{id}/message` (create) and `/quotation/message/{messageId}` (update/delete). All message mutations require re-fetching the quotation. `QuotationMessageCreate`: `{ type, authorId, authorName, message, answerRef? }`. `QuotationMessageUpdate`: `{ type?, message?, answerRef? }`.

**Currency default in create mode** — When a company is selected, the currency auto-defaults to the channel's default market currency (via `channel.defaultMarket` → market lookup → `market.currency._id`), falling back to `availableCurrencies[0]`.

**Deletable statuses** — Delete is available for `draft`, `requested`, `rejected`, `expired`, and `canceled` quotations, unless the quotation is external (below). Statuses like `pending`, `accepted`, `confirmed`, and `finalized` do not allow deletion. `isQuotationDeletable()` (`shared/utils/quotation.ts`) is the one rule for the list row action and the edit page.

**External (read-only) quotations** — A quotation with an `externalReference` (e.g. `system: 'monitor-erp'`) is owned by that system. The API refuses update, delete, extend and every status change with "Quotation is managed by … and cannot be modified in Geins", so Studio renders it in the read-only layout in **any** status (draft and requested included) and leaves those actions out: `isQuotationEditable()` and `isQuotationDeletable()` both return `false`, and `statusActions` is empty. The summary sidebar shows a lock `Item` ("Read-only quotation" + the shared `managed_externally` copy) and the external quotation and order numbers (`externalReference.number` / `orderNumber`; `system` is a raw id, so the copy stays generic). Kept: New quotation, Copy as new draft (a copy is a new draft with no reference — the user's way to edit), and messages (the API accepts `POST quotation/{id}/message`). **Check on every load:** a Studio quotation gains the reference once it's exported, so `parseEntityData` re-derives it from each response — never cache it from create.

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

**`prepareUpdateData` must NOT spread** — `entityDataUpdate` contains response-only fields (`billingAddress`, `shippingAddress`, `total`, `company`, `owner`, `customer`, `communication`, `changelog`). Only include OpenAPI update schema fields: `name`, `validTo`, `companyId`, `ownerId`, `customerId`, `validPaymentMethods`, `validShippingMethods`, `suggestedShippingFee`, `terms`, `billingAddressId`, `shippingAddressId`, `items`, `orderDetails`.

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
