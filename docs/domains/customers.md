# Customers Domain

> Company (wholesale account) management: companies, buyers, sales reps, addresses, and price list assignments.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Customers domain manages B2B wholesale accounts. A company is the central entity, with buyers (contact persons who place orders), sales representatives, billing/shipping addresses, and assigned price lists.

## Key Concepts

**Company ↔ Buyer relationship** — Companies have multiple buyers. Buyers are scoped to a company and can be assigned dedicated price lists (`restrictToDedicatedPriceLists`). Buyer CRUD is nested under the company: `/wholesale/account/{companyId}/buyer`.

**Sales representatives** — Sales reps are lightweight references (`firstName`, `lastName`, `phone`, `accountIds`) linked to companies.

**Company groups** — Implemented via the `tags` field on the company. The UI converts between tag strings and "company groups" display format using `extractCompanyGroupsFromTags()` / `convertCompanyGroupsToTags()`.

**VAT validation** — `validateVatNumber(vatNumber)` calls the VIES service to validate EU VAT numbers, returning `CustomerVatValidation` with validation status, name, and address.

## API Shape Quirks

**`priceLists` type mismatch** — The response returns `CustomerPriceList[]` (objects with `_id`, `name`, `channel`, `currency`, `active`, `productCount`, `accountSpecific`, `wholesaleAccountId`, `readOnly`). Create and update requests expect `string[]` (just price list IDs).

**Connected vs own price lists** — `priceLists` mixes the company's connected lists (shared, or account lists owned by another account) with its own account lists (see [Pricing → Shared and account lists](./pricing.md#shared-and-account-lists)). The company page's **Pricing** tab splits them with `isOwnAccountPriceList(pl, company._id)`: connected lists fill the "Connected price lists" card, quick add and sidebar count; own lists are kept apart. The own lists feed the **Company set prices** card: [`useCompanyPriceLists`](../composables/useCompanyPriceLists.md) holds them (saved lists plus unsaved drafts), and the card shows them as a table — one row per channel and currency, with an Active switch (locked for a `readOnly` ERP list) that "Save company" saves before the company update (see [Pricing → Studio-managed company lists](./pricing.md#shared-and-account-lists)). "Add company price list" opens [`CompanyPriceListAddDialog`](../components/company/CompanyPriceListAddDialog.md) for a free channel and currency and adds an unsaved draft row, which a draft-only Remove drops again. Each row's "Manage prices" ("View prices" for an ERP list) opens a sub view of the Pricing tab with "Back to pricing" and that list's [`CompanyPriceListEditor`](../components/company/CompanyPriceListEditor.md) — rules, selection and the company price grid, read-only for an ERP list. Opened sub views stay mounted in the tab's single KeepAlive child (`v-for` over opened entries, `v-show` on the active one, keyed by entry key), so edits survive going back and switching lists; they count as unsaved changes even while a list is off, and survive a company reload (e.g. after the buyer panel closes). The card warns (never blocks) when the company has an `externalId` and Studio manages one of its lists, and notes how many buyers are restricted to their own lists while any list is active. Updates send connected ids only — the account update keeps its own lists when `priceLists` leaves them out. A buyer's `priceLists` keeps nothing back, so the buyer panel's options add the buyer's assigned account lists (the list endpoint never returns them).

**`buyers` in create/update** — `CompanyBuyerCreate` currently requires `_id: string` (marked as TODO to remove). Buyer `priceLists` follows the same pattern: objects in response, string IDs in requests.

**`salesReps` in create/update** — Sent as `string[]` (account IDs). Response returns full `CustomerSalesRep[]` objects.

**Field selection** — `list({ fields: ['buyers', 'salesreps'] })` and `get(id, { fields: ['buyers', 'salesreps', 'addresses', 'pricelists'] })`. Use field filters to control payload size.

**Price list edit route** — `/pricing/price-lists/[id]` — use `entityEditUrl('price_list', id)` to generate links.

## Contracts (Cross-Domain Usage)

| Type                | Used By | Purpose                             |
| ------------------- | ------- | ----------------------------------- |
| `CustomerCompany`   | Orders  | Company selection for quotations    |
| `CompanyBuyer`      | Orders  | Buyer selection for quotations      |
| `CustomerPriceList` | Pricing | Price list display on company cards |
| `Address`           | Orders  | Billing/shipping address selection  |
| `CustomerOrder`     | Orders  | Company order history display       |

## Dependencies

- **Depends on**: Pricing (price list references via `CustomerPriceList`)
- **Depended on by**: Orders (company, buyer, and address selection for quotations)

## Key Files

| Layer       | Path                                                  |
| ----------- | ----------------------------------------------------- |
| Types       | `shared/types/Customer.ts`                            |
| Repository  | `app/utils/repositories/customer.ts`                  |
| Composables | `useCustomerCompanies.ts`, `useCompanyOrders.ts`      |
| Components  | `app/components/company/CompanyBuyerPanel.vue`        |
| Pages       | `app/pages/customers/companies/index.vue`, `[id].vue` |

## Decision Log

**2025-06-01: Company groups via tags**
Rather than a dedicated "groups" entity, company groups are encoded as tags on the company. Simpler schema and API, with UI helpers to convert between tag strings and group display format.

**2025-08-01: Nested buyer CRUD under company**
Buyers are scoped to a company via `/wholesale/account/{companyId}/buyer`. This enforces the business rule that buyers always belong to a company and simplifies authorization.
