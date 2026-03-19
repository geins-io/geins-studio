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
- `POST /product/pricelist/{id}/previewprice` — Preview a single product's calculated price

**Copy** — `POST /product/pricelist/{id}/copy` creates a duplicate price list. Accessed via `productApi.priceList.id(id).copy()`.

## Composable Architecture

The pricing domain has the most composables (6), each with a focused responsibility:

| Composable | Purpose |
| --- | --- |
| `usePriceListProducts` | Product selection and CRUD within a price list |
| `usePriceListProductsTable` | Column definitions and table interactions for the products table |
| `usePriceListRules` | Global volume pricing rule management |
| `usePriceListVolumePricing` | Per-product volume pricing panel interactions |
| `usePriceListPreview` | Preview endpoint calls and result handling |
| `usePrice` | Price/currency formatting and conversion utilities |

These compose together on the `[id].vue` edit page. `usePriceListProducts` manages the data, `usePriceListProductsTable` renders it, `usePriceListRules`/`usePriceListVolumePricing` handle the rules UI, and `usePriceListPreview` coordinates live calculations.

## Contracts (Cross-Domain Usage)

| Type | Used By | Purpose |
| --- | --- | --- |
| `ProductPriceList` | Customers | Price list assignment to companies |
| `CustomerPriceList` | Customers | Slimmed-down price list view on company cards |
| `PriceListProduct` | Pricing pages | Per-product pricing rows |
| `PriceListRule` | Pricing pages | Volume pricing tiers |

## Dependencies

- **Depends on**: Products (product data, SKU pricing, categories for selectors)
- **Depended on by**: Customers (price list assignment), Orders (quotation item pricing via price lists)

## Key Files

| Layer | Path |
| --- | --- |
| Types | `shared/types/Product.ts` (price list types colocated with product types) |
| Repository | `app/utils/repositories/product.ts` (`.priceList` sub-repo) |
| Composables | `usePriceListProducts.ts`, `usePriceListProductsTable.ts`, `usePriceListRules.ts`, `usePriceListVolumePricing.ts`, `usePriceListPreview.ts`, `usePrice.ts` |
| Components | `app/components/price-list/` |
| Pages | `app/pages/pricing/price-list/list.vue`, `[id].vue` |

## Decision Log

**2025-07-01: Price list types colocated in Product.ts**
Price lists are tightly coupled to products (each price list contains product pricing entries). Keeping the types in `Product.ts` reflects this relationship and avoids circular imports.

**2025-08-01: Six composables for separation of concerns**
The pricing page is the most complex in the app. Splitting into focused composables (products, products-table, rules, volume-pricing, preview, price-formatting) keeps each unit testable and avoids a monolithic page script.
