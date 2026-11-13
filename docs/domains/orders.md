# Orders Domain

> Quotation lifecycle management: create, send, negotiate, accept, confirm, finalize.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Orders domain manages the quotation-to-order workflow. Currently it covers quotations — B2B sales proposals that go through a multi-step lifecycle before becoming orders. The domain also includes basic order types for viewing company order history.

## Key Concepts

**Quotation lifecycle** — A quotation progresses through a state machine:

```
requestDraft → requested → canceled    (buyer requests; read-only, the seller can only cancel)
                         ↘ revised     (answered by an offer, labelled "Answered")

               draft → pending → accepted → confirmed → finalized
                               ↘ expired      ↘ canceled
                               ↘ rejected
               pending / expired → revised    (a later version was sent in its place)
```

All status transitions are one-way (no revert to draft). Each transition is a `POST /quotation/{id}/{action}` with a `StatusTransitionRequest` body. The `expire` transition is automatic (never triggered manually).

**Buyer requests** — A buyer can ask for a quotation from the sales portal. While they write it, the quotation is `requestDraft` and only the buyer edits it. Once they send it, it becomes `requested` and it is the seller's turn. With Platform's quotation revisions the API refuses `PATCH`, `send` and `DELETE` on a requested quotation (`422`, pointing to `POST quotation/{id}/revision`); `cancel` still works. What the buyer sent is on `quotation.request`, shown read-only by `QuotationRequestDetails`; its `requestedValidTo` is only a wish (it never sets `validTo`), and Studio doesn't show it.

**Revisions** — Platform's quotation revisions answer a quotation with a new version rather than a copy. `POST quotation/{id}/revision` makes a draft with the same number and the next revision, linked through `revisionOf`; sending it moves the source (`requested`, `pending` or `expired`) to `revised`, with `revisedBy` pointing at the new version. `revised` is terminal: read-only, not deletable, and the page shows no actions on it at all (`statusActions` has an empty `revised` case and the sent-mode action bar is hidden), not even New quotation or Copy as new draft. The response fields:

- `revision` — the last part of the quotation number, as an int. A copy made in the same month takes the next one too, so it numbers versions but doesn't count them.
- `revisionOf` / `revisedBy` — `QuotationVersionRef` (`{ quotationId, quotationNumber }`, named as the API names them, no `_id`/`_type`), or null.
- `request.releasedAt` — when the request reached the seller; a revision keeps its source's.
- `revisions` — only with `fields=revisions` (or `all`): every version in the chain as `QuotationRevision`, newest first, the open draft included. Empty on a quotation outside a chain.

**Answering and revising** — The seller answers with a new version, never by editing the one the buyer has:

| Step                           | v00 (the buyer's request)        | v01 (the seller's offer)                          |
| ------------------------------ | -------------------------------- | ------------------------------------------------- |
| Buyer sends the request        | `requested`                      | doesn't exist                                     |
| Seller clicks **Create offer** | `requested`, unchanged           | `draft` with `revisionOf`; the buyer can't see it |
| Seller sends v01               | `revised`, shown as **Answered** | `pending`, the live offer                         |

- **Create offer** is the main button on a requested quotation; **Revise quotation** (`revise_entity`) sits in the ⋯ menu on a pending or expired one, beside Copy as new draft, which stays for an alternative offer. Both call `orderApi.quotation.revise(id)` and open the new draft. `canReviseQuotation()` is the rule: `requested`, `pending` or `expired`, and not external.
- **One open draft per chain.** When `revisions` already has a draft (`openRevisionDraft()`), both read **Open draft (vN)** and open it without calling the route. The route is called with `suppressErrorToast`: if it fails, the page re-reads `revisions` and opens a draft that was started meanwhile; otherwise it raises the global toast itself (`showGlobalErrorToast`), adding a **Copy as new draft** action on a `404`, which means the buyer has left the company.
- **The offer draft** is an ordinary draft (`isRevisionDraft()`: `draft` with a `revisionOf`): lines, prices, discount, owner, terms and validity are edited as usual. Saves ask for `fields: ['all']`, as the load does, so the PATCH response keeps `revisions`. The owner isn't pre-filled, so `sendBlockReasons` blocks Send until one is picked. A revision keeps its buyer (the API answers `422` to a change), so the Customer panel's buyer select is locked (`buyerDisabledReason`); the addresses stay editable. A draft from a request shows **Request details** read-only and no Order details card (`canEditOrderDetails()` stays `draft && !request`).
- **Blocked send.** If the version the draft replaces was answered or canceled in the meantime, `revisionSendBlock()` reads its status from `revisions` and adds the reason to `sendBlockReasons` (the request was canceled / the buyer withdrew it / version N was canceled / the buyer answered version N). The API answers such a send with `409`; the page then reloads, so the dialog says why. The draft stays a draft.
- **Discard draft** replaces Delete in a revision draft's ⋯ menu: a `DialogDelete` confirm, `DELETE quotation/{id}`, then the page opens the version it would have replaced, which isn't changed.
- **Recovery.** A failure before the send leaves the draft open: open it from the source (Open draft) or discard it. If a send fails after the source has closed, sending again finishes the job, and the draft can no longer be deleted.

**Versions** — Every version is its own quotation, so it opens on its own page (`entityEditUrl('quotation', quotationId)`); the quotation page fetches `fields: ['all']`, which includes `revisions`. The chain's **live** version is the newest that isn't a draft (`liveRevision()`): the one the buyer can answer. How the page shows the chain:

- **Version picker** — `QuotationVersionSelect`, first in the header's action bar, when `revisions` has more than one entry. It lists them newest first as "number · status · sent date"; the live version reads **Latest**, an answered request **Answered**.
- **Replaced versions** — `isReplacedVersion()`: `revised`, `revisedBy` set, or not the live version (a draft never is). `QuotationReplacedNotice` tops the General and Changelog tabs with the prototype's copy and **View latest version**, linking to the live version (`replacingVersion()`, which falls back to `revisedBy` when no chain is listed).
- **Summary** — a **Version** row with `revision` as "v 03" (`orders.version_tag`, as the list shows it), and on a revision a **Revision of** row linking to `revisionOf`.

**One thread per chain** — Platform reads messages for the whole chain, ordered by time, on whichever version is asked for, and stores a new message (the buyer's or the seller's) on the live version. Each message carries `quotationNumber`, the version it was written on. Studio shows the thread only on the latest version: a replaced version (`isReplacedVersion()`) has no Communication tab, so its tabs are General and Changelog (`changelogTab` moves to 1). A draft never had the tab. `QuotationMessageThread` tags every message with its version, "v 01", looking `quotationNumber` up in `revisionsByNumber()` (the chain plus the quotation itself, so a quotation outside a chain is tagged too). Edit and delete still go by message id, and posting refreshes the quotation, which reads the whole thread again.

**Answered requests** — A buyer's request answered by an offer is `revised` like any replaced version: Platform keeps one status and leaves the label to clients. The rule is `isAnsweredRequest()` (`shared/utils/quotation.ts`), the same as the sales portal's: a `revised` version with no `validFrom` was never sent, so it was the buyer's request. Its badge in the summary and in the Quotation details card reads **Answered** (`orders.answered_request`, passed as `statusLabel` / `label`). Don't test "has a `request` and no `revisionOf`": a request the Monitor sync priced in place and later revised matches that too, and it was a real offer. `QuotationWorkflowInfo` starts an answered request's flow at Requested.

**Order details** — `quotation.orderDetails` holds what goes onto the order when the quotation is finalized: `goodsLabel`, `customerOrderNumber` (the buyer's PO number or reference, labelled **PO number / reference** as in the Sales Portal) and `desiredDeliveryDate`. The API also has `customerReference`, kept on the quotation only; Studio doesn't use it, and `customerOrderNumber` is the one field for the buyer's reference. At checkout the buyer can't change them, and copy doesn't carry them over: a PO number belongs to one order. Where they come from decides how Studio shows them (`canEditOrderDetails()` in `shared/utils/quotation.ts`):

- **A buyer's request** brings them. The quotation shows them only in **Request details** (`QuotationRequestDetails`), read-only in every status, in place of the order details card, so nothing shows twice. A requested quotation never goes back to `draft`, so they're never edited.
- **A draft the seller created** (no request, not external) gets an editable **Order details** card between Quotation details and Customer (`QuotationOrderDetailsFields`). It's part of the form, and its changes go out with the draft's normal PATCH as `orderDetails`. The create step leaves it out: the seller fills it in once the draft exists.
- **Once that draft is sent** (`pending` and later), or when an external system owns the quotation, they're locked: the read-only **Order details** card (`QuotationOrderDetailsCard`) shows them in the same place, with no edit action.

Editing them on a draft:

- **Changes only** — `orderDetailsRequest(values, stored)` sends just the fields that are set and differ from the stored ones; the API keeps any field left out. With nothing to send it returns `undefined`, because the API refuses an empty `orderDetails`. `reshapeEntityData` therefore sets `orderDetails: undefined`, so the unsaved-changes snapshot holds only the seller's pending changes, and the stored values live in the page's `storedOrderDetails` ref. Where they're locked (requested, sent, external), `parseEntityData` seeds the form fields empty and the schema gets no stored values, so nothing is validated or sent.
- **Replace, not clear** — the API can't clear a stored value. `createOrderDetailsSchema` (`app/utils/quotation-order-details.ts`) shows an error when the seller empties a field that has one, instead of silently keeping the old value. It also matches the API's limits: goods label 1–500, PO number / reference 1–30 characters, and a delivery date in the future (checked only when it changes, so an older stored date doesn't block saving).
- **Calendar days** — the delivery date names a day, not a moment, and the API takes it as that day at UTC midnight (`YYYY-MM-DDT00:00:00Z`). Converting local midnight to a UTC instant would move the order a day back in Sweden. `shared/utils/calendar-day.ts` holds the rule: a value at exactly UTC midnight is already a calendar day; any other instant names its local day. The form holds the day's local midnight (`calendarDayToLocalIso`) so `FormInputDate` shows the right day, and `toCalendarDayIso` turns it back for the request. `FormInputDate` itself is unchanged; `validTo` stays an instant.

**Owner** — A quotation's owner is **either** a user (`ownerId`, normally one of the company's sales reps) **or** a free-text name (`ownerName`, 1–200 characters, linked to no user). Never both: the API answers `400` to both, and sending one clears the other (there's no separate clear, and an owner can't be removed). The response always has `owner`: a user has `_id` = username and `name` = "FirstName LastName"; a free-text owner has `_id: ''` and only `name`; no owner (a buyer's request) has both empty. Show `owner.name` everywhere (Quotation details, summary, list column, which the list's quick filter also searches); `fullName()` only builds the rep suggestions.

- **Drafts only** — the owner changes on `draft` (revision drafts included), create step included. A requested quotation refuses every `PATCH`; its owner is set on the offer draft "Create offer" makes. Sent statuses answer `400` to the owner fields; changing the owner after sending comes with STU-526.
- **The field** — `FormInputCombobox` on `details.owner`, holding text: the company's reps as suggestions under "Existing sales reps", plus a saved user owner who isn't one of them (the API takes any account user). `quotationOwnerRequest()` (`app/utils/quotation-owner.ts`) maps the text, in order: a suggestion picked from the list (the combobox's `select`) while the text still shows it is that user, since reps can share a name; text unchanged from the saved owner keeps it as it is (so a namesake rep or free-text name can't take over); an exact (trimmed, case-insensitive) suggestion name is `ownerId`; other text is `ownerName`. Blank sends neither, so once a draft has an owner the schema refuses an empty field ("A saved value can't be removed, only changed"), and Save checks it like the order details. `reshapeEntityData` uses `savedQuotationOwnerRequest()` so the unsaved-changes snapshot matches.
- **Send** is blocked only with no owner (`orders.send_requires_owner`). The stale-snapshot sync compares only a user owner with the company's live reps; a free-text owner has no `_id` and is never stale.
- **Copy and revise** keep a free-text owner.

**`requestDraft` and `revised` are never listed** — `orderApi.quotation.list()` excludes them server-side by default (`VISIBLE_QUOTATIONS_QUERY` in `app/utils/repositories/order.ts`): a request draft belongs to the buyer until they submit it, and a revised version has a later one in its place. The API ignores `exclude` when `all: true` is set and only subtracts `exclude` from an `include`. So the query includes every quotation with `hasExternalReference: true OR false` and excludes `statuses: ['requestDraft', 'revised']`. It doesn't list the allowed statuses, so statuses the API adds later still show up. A caller that passes its own batch query to `list()` or `query()` must exclude them the same way.

**One row per quotation** — The list shows each revision chain once, as its live version. A **Version** column shows `revision` as "v 03" (`orders.version_tag`), and when the chain has an open revision draft, a **Draft (v 04)** link beside it opens the draft. The draft comes from the row's `revisions` (`openRevisionDraft()`), so the list asks for `fields: company, owner, customer, items, revisions` (the API's default set plus `revisions`). The draft is its own quotation and would show as a row of its own: the query has no filter for revision drafts yet, so the page drops the drafts a listed row links to (`withoutLinkedRevisionDrafts()`) before mapping the rows. A draft no row links to (its source was deleted, or the response had no `revisions`) keeps its own row, so it can't vanish from the list.

**Snapshots** — When a quotation is created, the API captures point-in-time snapshots of the company (`QuotationCompany`), owner/sales rep (`QuotationOwner`), and buyer (`QuotationCustomer`). Each snapshot extends `EntitySnapshot` with `_id`, `_type`, `_snapshotAt`. Read IDs via `company._id`, `owner._id`, `customer._id` (not `companyId`/`ownerId`). Owner and customer use `firstName`/`lastName` (no `email`); only the owner has a combined `name`, which is also the free-text owner's only field. Addresses use the standard `Address` type.

**Items** — `QuotationUpdate.items` accepts `QuotationItemCreate[]` (shape: `{ skuId, quantity, unitPrice? }`), not the response item type. The response `QuotationItem` includes enriched fields: `ordPrice`, `listPrice`, `name`, `articleNumber`, `primaryImage`.

**Live preview** — `POST /quotation/{id}/preview` calculates totals without persisting. Only available in editable (draft) mode. Returns `{ items, total }` where items are enriched with `ordPrice`/`listPrice` from applied price lists. `unitPrice` is never overwritten from the preview response. **Infinite loop prevention**: Do NOT watch `quotationItems` to trigger preview — the preview response updates `skuItemData` (ordPrice/listPrice), which changes `quotationItems` output, creating a loop. Trigger from explicit user-action handlers instead.

**Sent mode** — Three mutually exclusive modes: `createMode` (route param `new`), draft (editable) mode, and sent (read-only) mode. `isQuotationEditable()` (`shared/utils/quotation.ts`) is the one rule: only `draft` is editable, every other status (`requested` included) is read-only. `sentMode` is a `ref<boolean>` set from it in `parseEntityData` on every load — never reverts since transitions are one-way. In sent mode, General tab renders read-only cards; Products tab is replaced by Communications tab. Status transitions use `POST /quotation/{id}/{action}` → `refreshEntityData()` to update all UI state. Nothing in sent mode goes through `useEntityEdit`'s update (the save button, the customer panel and the on-load snapshot re-save are draft only): the API refuses it, and a full update that went through would rebuild the cart and reset the payment and shipping method the buyer chose at checkout.

**General tab layout** — Both layouts show the same cards in the same order: **Quotation details** → **Order details** (or **Request details**) → **Customer**, then Items & summary in sent mode. Quotation details holds the owner under the name and the payment terms under the expiration date: form fields on a draft, read-only values in sent mode. In sent mode the owner name comes from the `owner` snapshot, since the unmounted form field has cleared `details.owner`. The Customer card and its Change panel (`ContentEditCustomerPanel`) cover the buyer and the addresses only. The form schema requires the owner only in the create step; after that `sendBlockReasons` blocks Send without one, so a draft saved without an owner (e.g. through the API) opens with no field error. Payment terms have no `Net 30` fallback on load: a draft without stored terms shows the field empty, so Send stays blocked until the seller sets them.

**Requested quotations** — Read-only, like every status but `draft`: the API refuses `PATCH`, `send` and `DELETE` on them. They open in the sent layout with **Request details** in the order details' place. The main button is **Create offer** (see Answering and revising below); **Cancel quotation**, which declines the request, sits in the ⋯ menu (`dropdownActions`). Studio never sends a request as it is: an unchanged request still goes Create offer → set owner and terms → Send. The API's `reject` from `requested` is the buyer withdrawing it, so Studio doesn't offer it. `QuotationWorkflowInfo` starts its flow at Requested (`workflowStartStatus`). A `requestDraft` opened by URL throws the standard 404 via `usePageError().throwPageError(404)`.

**Communications** — Messages (`QuotationMessage`) are typed as `internal`, `toCustomer`, or `fromCustomer`. CRUD via `/quotation/{id}/message` (create) and `/quotation/message/{messageId}` (update/delete). All message mutations require re-fetching the quotation. `QuotationMessageCreate`: `{ type, authorId, authorName, message, answerRef? }`. `QuotationMessageUpdate`: `{ type?, message?, answerRef? }`.

**Currency default in create mode** — When a company is selected, the currency auto-defaults to the channel's default market currency (via `channel.defaultMarket` → market lookup → `market.currency._id`), falling back to `availableCurrencies[0]`.

**Deletable statuses** — Delete is available for `draft`, `rejected`, `expired`, and `canceled` quotations, unless the quotation is external (below). `requested` (the seller cancels it instead), `pending`, `accepted`, `confirmed`, `finalized` and `revised` (a chain never loses a version it has shown) do not allow deletion. `isQuotationDeletable()` (`shared/utils/quotation.ts`) is the one rule for the list row action and the edit page.

**External (read-only) quotations** — A quotation with an `externalReference` (e.g. `system: 'monitor-erp'`) is owned by that system. The API refuses update, delete, extend and every status change with "Quotation is managed by … and cannot be modified in Geins", so Studio renders it in the read-only layout in **any** status (draft included) and leaves those actions out: `isQuotationEditable()` and `isQuotationDeletable()` both return `false`, and `statusActions` is empty. The summary sidebar shows a lock `Item` ("Read-only quotation" + the shared `managed_externally` copy) and the external quotation and order numbers (`externalReference.number` / `orderNumber`; `system` is a raw id, so the copy stays generic). Kept: New quotation, Copy as new draft (a copy is a new draft with no reference — the user's way to edit), and messages (the API accepts `POST quotation/{id}/message`). **Check on every load:** a Studio quotation gains the reference once it's exported, so `parseEntityData` re-derives it from each response — never cache it from create.

**Changelog** — `changelogApi.getForEntity('quotation', id)` fetches changelog entries. `ChangelogEntry.id` is a `number` from the API (typed as `string | number`). Entries with `subEntity === 'message'` are filtered out (messages are shown separately). The `changes` field is a JSON string of `[{ p: string, c: string[] }]`.

**Buyer decision** — `customer.approvedAt` / `customer.rejectedAt` stay null until the buyer accepts or rejects. Once one is set, the sent-mode Customer card shows "Accepted {date}" or "Rejected {date}" under the buyer's name, via `quotationBuyerDecision()` (`shared/utils/quotation.ts`); if both are ever set, the later one wins. The changelog has the same events — this is the at-a-glance answer.

## API Shape Quirks

**`validPaymentMethods`** — Response: `{ paymentId: number, name: string }`. Request: `{ paymentId: string }` (string, no `name`).

**`validShippingMethods`** — Response: `{ shippingId: number, name: string, shippingFee: number }`. Request: `{ shippingId: string, shippingFee?: number }`.

**`quotationNumber`** — Read-only, auto-generated by the backend. Not accepted on PATCH.

**`discount`** — Optional `{ type: 'fixedAmount' | 'percent', value: number }`. Accepted by both PATCH and preview endpoints.

**`settings`** — `{ requireConfirmation?: boolean }`. Controls whether the workflow requires an explicit confirmation step.

**`terms`** — Plain `string` on create/update. Response returns `string` (not `{ text: string }` as previously documented).

**`QuotationTotal` shape** — `{ subtotal, discount, shipping, margin, vat, grandTotalExVat, grandTotalIncVat }` — all `number`. Note: field is `vat` (not `tax`), and grand total is split into ex-VAT and inc-VAT variants.

**`QuotationCompany.vatNumber`** — The company snapshot uses `vatNumber` (not `orgNr`).

**`QuotationStatus` casing** — Status values are camelCase as the API sends them: single words are lowercase (`'draft'`, `'pending'`, `'requested'`, `'revised'`), and the one compound is `'requestDraft'`.

**`request`, `orderDetails`, `externalReference`, `orderPublicId`** — Omitted from the response when empty. `QuotationRequest`, `QuotationOrderDetails`, `QuotationExternalReference`, `QuotationVersionRef` and `QuotationRevision` are value objects with no `_id`/`_type`. The list page keeps them (and the revision fields) on the row data but excludes them as columns.

**`prepareUpdateData` must NOT spread** — `entityDataUpdate` contains response-only fields (`billingAddress`, `shippingAddress`, `total`, `company`, `owner`, `customer`, `communication`, `changelog`). Only include OpenAPI update schema fields: `name`, `validTo`, `companyId`, `ownerId` or `ownerName`, `customerId`, `validPaymentMethods`, `validShippingMethods`, `suggestedShippingFee`, `terms`, `billingAddressId`, `shippingAddressId`, `items`, `orderDetails`.

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
