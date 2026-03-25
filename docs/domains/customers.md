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

**`priceLists` type mismatch** — The response returns `CustomerPriceList[]` (objects with `_id`, `name`, `channel`, `currency`, `active`, `productCount`). Create and update requests expect `string[]` (just price list IDs).

**`buyers` in create/update** — `CompanyBuyerCreate` currently requires `_id: string` (marked as TODO to remove). Buyer `priceLists` follows the same pattern: objects in response, string IDs in requests.

**`salesReps` in create/update** — Sent as `string[]` (account IDs). Response returns full `CustomerSalesRep[]` objects.

**Field selection** — `list({ fields: ['buyers', 'salesreps'] })` and `get(id, { fields: ['buyers', 'salesreps', 'addresses', 'pricelists'] })`. Use field filters to control payload size.

**Price list edit route** — `/pricing/price-list/[id]` — use `getEntityUrlFor('price-list', 'pricing', id)` to generate links.

## Contracts (Cross-Domain Usage)

| Type | Used By | Purpose |
| --- | --- | --- |
| `CustomerCompany` | Orders | Company selection for quotations |
| `CompanyBuyer` | Orders | Buyer selection for quotations |
| `CustomerPriceList` | Pricing | Price list display on company cards |
| `Address` | Orders | Billing/shipping address selection |
| `CustomerOrder` | Orders | Company order history display |

## Dependencies

- **Depends on**: Pricing (price list references via `CustomerPriceList`)
- **Depended on by**: Orders (company, buyer, and address selection for quotations)

## Key Files

| Layer | Path |
| --- | --- |
| Types | `shared/types/Customer.ts` |
| Repository | `app/utils/repositories/customer.ts` |
| Composables | `useCustomerCompanies.ts`, `useCompanyOrders.ts` |
| Components | `app/components/company/CompanyBuyerPanel.vue` |
| Pages | `app/pages/customers/company/list.vue`, `[id].vue` |

## Decision Log

**2025-06-01: Company groups via tags**
Rather than a dedicated "groups" entity, company groups are encoded as tags on the company. Simpler schema and API, with UI helpers to convert between tag strings and group display format.

**2025-08-01: Nested buyer CRUD under company**
Buyers are scoped to a company via `/wholesale/account/{companyId}/buyer`. This enforces the business rule that buyers always belong to a company and simplifies authorization.
