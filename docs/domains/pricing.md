# Pricing Domain

> Price list management: lists, per-product pricing, volume pricing rules, and live preview.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Pricing domain manages price lists — named collections of product prices scoped to a channel and currency. Each price list can have per-product pricing, global and per-product volume pricing rules, and automatic product inclusion via selection queries. Companies are assigned price lists to control what prices their buyers see.

## Key Concepts

**Price list ↔ Product relationship** — A price list contains `PriceListProduct` entries. Each entry specifies a product's price, margin, discount percentage, and pricing mode. Products can be added manually or automatically via `productSelectionQuery` + `autoAddProducts`.

**Pricing modes** (`PriceListPriceMode`) — `fixed` (explicit price), `margin` (markup over purchase price), `discount` (percentage off regular price), `rule` (volume pricing), `auto` / `autoRule` / `autoFixed` (system-calculated). The mode controls which fields are editable in the products table.

**Volume pricing rules** (`PriceListRule`) — Quantity-based pricing tiers. Each rule specifies a `quantity` threshold and a `margin`, `discountPercent`, or `price`. Rules can be global (applied to all products) or per-product. The `lastFieldChanged` tracks which field was most recently edited for UI calculation logic.

**Preview** — Two preview endpoints:

- `POST /product/pricelist/{id}/preview` — Preview the entire price list with proposed changes
- `POST /product/pricelist/preview` — Preview a list that isn't saved yet (same `{ priceList, batchQuery }` body). Echoes `wholesaleAccountId` without checking the account or its free slot; create does both. Never send back the `new_`-prefixed ids a preview returns
- `POST /product/pricelist/{id}/previewprice` — Preview a single product's calculated price. Only for products in a saved list, and ignores rules; a new list works the values out locally (`calculatePriceListPrices`)

**Query** — `POST /product/pricelist/{id}/query` returns a saved list's rows read-only (needs only read access). `productApi.priceList.id(id).query(batchQuery, options)` with `batchQueryNoPagination` and `fields: ['products', 'productinfo']` returns the same rows as preview; feed them to `transformProductsForList`. Used where nothing is previewed (the company Company set prices grid).

**Copy** — `POST /product/pricelist/{id}/copy` creates a duplicate price list. Accessed via `productApi.priceList.id(id).copy()`. A copy is always a shared list.

## Shared and account lists

There are two kinds of price list. A **shared** list can be assigned to any number of wholesale accounts (companies). An **account list** belongs to exactly one account and holds the prices agreed with it; an account owns at most one per channel and currency. Every price list response, on both `product/pricelist` and `wholesale/account`, says which kind it is:

| Field                | Shared list         | Account list                      |
| -------------------- | ------------------- | --------------------------------- |
| `accountSpecific`    | `false`             | `true`                            |
| `wholesaleAccountId` | `""` (never `null`) | the owning account's `_id`        |
| `readOnly`           | usually `false`     | `true` when an ERP import owns it |

Branch on `accountSpecific` — never null-check `wholesaleAccountId`. `isOwnAccountPriceList(priceList, accountId)` (`#shared/utils/price-list`) answers "is this the account's own list". A list with `accountSpecific: true` and a different owner was assigned here from another account and behaves like a shared list in that account's UI.

- **Finding them** — account lists never appear in `GET product/pricelist/list` or a product's `pricelists`. Start from the account: `GET wholesale/account/{id}?fields=pricelists` returns shared and account lists mixed.
- **Creating** — `POST product/pricelist` with `wholesaleAccountId` (and `active: true`; lists are inactive by default) creates an account list and assigns it. The owner is fixed: `PATCH` ignores `wholesaleAccountId`, so sending a GET body back is safe. That's why `wholesaleAccountId`/`readOnly` are optional on `ProductPriceListBase` (create bodies omit them) and required only on the `ProductPriceList` response.
- **Account updates** keep the account's own lists even when `priceLists` leaves them out, so the company page sends connected (shared) ids only. **Buyer updates** keep nothing back: a list left out of a buyer's `priceLists` is removed from that buyer, account lists included. An account list assigned to a buyer has no pricing effect (see restricted buyers below), but Studio still keeps such assignments on save — the company page's `buyerPriceListOptions` feeds them to the buyer panel — so it never drops data silently.
- **Renamed fields** — earlier builds sent `customerId`/`customerSpecific` on price lists; both are gone. Use `wholesaleAccountId`/`accountSpecific`.

**Studio-managed company lists** — a company without an ERP list turns its company set prices on and off with one switch on the company Pricing tab. The switch maps to the list's `active` and saves with "Save company": `handleUpdateCompany` saves the list first, then the company (`fields: ['all']`, whose reload brings the list back). `getCompanyPriceListSaveAction(list, enabled, contentDirty)` (`#shared/utils/price-list`) picks the call, and `companyPriceListCreateBody` / `companyPriceListUpdateBody` build its body from explicit fields, never a GET body:

- **Create** (on, no list yet) — `POST product/pricelist` with `wholesaleAccountId`, `active: true`, the company's default channel (`channels[0]`) and that channel's default currency, `exVat: true`, and `autoAddProducts: false` so the list starts empty. `name` is `{company name} {currency}` (`companyPriceListName`); `identifier` is `{externalId}-{currency}` (`companyPriceListIdentifier`) and left out when the company has no `externalId`. A taken channel/currency slot or identifier answers `409`. With edited content (`PriceListContent`: `rules`, `productSelectionQuery`, `products`), the body adds the rules without `_id`, the whole selection, and only the rows that carry a price.
- **Update** (list exists, content edited) — `PATCH product/pricelist/{id}` with `rules`, `productSelectionQuery` and `products` under the PATCH rules below, plus `active` when the switch changed too.
- **Activate / deactivate** (list exists, switch changed) — `PATCH product/pricelist/{id}` with `{ active }` only. Off keeps the list and its prices.
- **None** — the switch matches the list, or the list is read-only (`PATCH` on it answers `422`).

**Price list content PATCH rules** — from the product API swagger (`PATCH /product/pricelist/{priceListId}`). The PATCH is partial: a property left out or `null` is kept, so a content field Studio leaves `undefined` stays as saved.

- **`productSelectionQuery`** replaces the saved query entirely. Products that no longer match are removed from the list; matched products without a `products` entry are added at `staggeredCount: 1` in auto. Send the whole query.
- **`rules`** replace the saved rules, and a rule left out is deleted, so send them all, saved ones with their `_id`. New rules apply to products in auto. The request rule has `quantity`, `margin` and `discountPercent` only, no `price`.
- **`products`** is an upsert, not a replace: a row is matched by `_id` or by `productId` + `staggeredCount` (Studio uses the pair), and a product left out keeps its saved values. So send every manual row Studio changed:
  - a bare `{ productId, staggeredCount }` with no price field resets the row to auto;
  - `delete: true` removes a volume break, and only works for `staggeredCount > 1`; a product leaves the list only by falling out of the selection;
  - only the price field of the row's mode is set: `price` (fixed), `margin` or `discountPercent`. A GET row carries all three, so its `priceMode` picks one;
  - a row can't add a product the selection doesn't match.
- **`autoAddProducts`** "automatically add[s] any new products" to a category or brand list. Products the selection matches are added on save anyway, so a company list created with `autoAddProducts: false` still gets them, but not products created later.

Not stated in the swagger, to confirm with the backend: that `rules: []` deletes every rule; which products "with an explicit rule" revert to auto when rules change (those on a deleted rule, or all of them); and that a `POST` with a selection adds the matched products the way `PATCH` does, with `autoAddProducts: false`.

If the list call fails, the save stops before the company update, so everything stays unsaved for a retry (the global API error toast shows why). The switch counts as an unsaved change through `useEntityEdit`'s `externalChanges` until the saved list matches it.

When switched on, the card summarises the list from `GET product/pricelist/{id}?fields=counts`: `manualPriceProductCount` (products with a price of their own: fixed, margin, discount or rule) and `volumePriceProductCount` (products with a price at a quantity above 1). Both are `null` unless `counts` is requested; `getPriceListSummaryCounts` hides the counts line while either is `null`, and a failed read falls back to the list's `productCount`.

The card also shows two notices, never blocking: a warning on the Studio-managed branch when the company has an `externalId` (no flag marks an account's prices as external, and an import for the same channel and currency takes over a Studio-created list), and, while company set prices are on in either branch, a note counting the buyers with `restrictToDedicatedPriceLists` (see restricted buyers below).

An inactive ERP list stays on the card with its switch off and locked and its grid folded; an info notice outside the folded slot says the list is inactive in the external system and has to be activated there.

**Read-only lists and `force`** — `readOnly: true` means an ERP import maintains the list (today the Monitor import: identifiers `MON-` for shared, `MONC-` for account lists; branch on `readOnly`, not the prefix). `PATCH` and `DELETE` answer `422` unless the request has `?force=true`. A forced edit is undone by the next import, and a forced delete is permanent (a re-import gets a new id). Studio shows these lists locked. On the price list page (`[id].vue`) a read-only list gets a lock notice in the summary; its fields, rules, selection (`Selector` `disabled`) and grid (`setupReadOnlyPriceListColumns`, volume pricing in the read-only panel) are view-only; Save, Delete and the active switch are disabled; Copy still works (a copy is an editable shared list). Its rows load from `query`, not preview: there's nothing to preview, and an ERP list may have no selection query. No force override yet. An account list's summary links its owning company.

**Which price wins** — for the products and quantity tiers it prices, an account list beats the catalog price and every shared list, even a cheaper one (`forced` has no effect on an account list). Storefront order:

1. An `x-prices` token or a configured-product (CPQ) price
2. The account's own list
3. Lists assigned directly to the buyer, and forced lists
4. The cheapest shared list assigned to the account
5. The catalog price

Quotations rank one step differently: a list assigned to the buyer comes first, then the account list, then shared lists. The most specific list that prices a product wins even when a broader one is cheaper.

**Restricted buyers** — a buyer with `restrictToDedicatedPriceLists` is priced only from the lists assigned to it and never gets the account's own list, ERP or Studio-managed (step 2 is skipped). Assigning the account list to such a buyer doesn't work either; to give a restricted buyer special prices, create a normal shared list and put it in the buyer's `priceLists`. This applies in the storefront today. Quotations follow once PLA-893 ships; until then a quote for a restricted buyer can still use the account list.

## Composable Architecture

The pricing domain has the most composables (6), each with a focused responsibility:

| Composable                  | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `usePriceListProducts`      | Product selection and CRUD within a price list                   |
| `usePriceListProductsTable` | Column definitions and table interactions for the products table |
| `usePriceListRules`         | Global volume pricing rule management                            |
| `usePriceListVolumePricing` | Per-product volume pricing panel interactions                    |
| `usePriceListPreview`       | Preview endpoint calls and result handling                       |
| `usePrice`                  | Price/currency formatting and conversion utilities               |

These compose together on the `[id].vue` edit page. `usePriceListProducts` manages the data, `usePriceListProductsTable` renders it, `usePriceListRules`/`usePriceListVolumePricing` handle the rules UI, and `usePriceListPreview` coordinates live calculations.

## Contracts (Cross-Domain Usage)

| Type                | Used By       | Purpose                                       |
| ------------------- | ------------- | --------------------------------------------- |
| `ProductPriceList`  | Customers     | Price list assignment to companies            |
| `CustomerPriceList` | Customers     | Slimmed-down price list view on company cards |
| `PriceListProduct`  | Pricing pages | Per-product pricing rows                      |
| `PriceListRule`     | Pricing pages | Volume pricing tiers                          |

## Dependencies

- **Depends on**: Products (product data, SKU pricing, categories for selectors)
- **Depended on by**: Customers (price list assignment), Orders (quotation item pricing via price lists)

## Key Files

| Layer       | Path                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types       | `shared/types/Product.ts` (price list types colocated with product types)                                                                                  |
| Utils       | `shared/utils/price-list.ts` (`isOwnAccountPriceList`)                                                                                                     |
| Repository  | `app/utils/repositories/product.ts` (`.priceList` sub-repo)                                                                                                |
| Composables | `usePriceListProducts.ts`, `usePriceListProductsTable.ts`, `usePriceListRules.ts`, `usePriceListVolumePricing.ts`, `usePriceListPreview.ts`, `usePrice.ts` |
| Components  | `app/components/price-list/`                                                                                                                               |
| Pages       | `app/pages/pricing/price-lists/index.vue`, `[id].vue`                                                                                                      |

## Decision Log

**2025-07-01: Price list types colocated in Product.ts**
Price lists are tightly coupled to products (each price list contains product pricing entries). Keeping the types in `Product.ts` reflects this relationship and avoids circular imports.

**2026-10-26: Account lists kept apart from connected lists**
A company's own account lists are not "connected" lists: they can't be added or removed through `priceLists`, and they outrank shared lists. The company Pricing tab splits them out so the connected-lists card, quick add and save only ever touch shared ids, and the own lists feed the Company set prices card.

**2025-08-01: Six composables for separation of concerns**
The pricing page is the most complex in the app. Splitting into focused composables (products, products-table, rules, volume-pricing, preview, price-formatting) keeps each unit testable and avoids a monolithic page script.
