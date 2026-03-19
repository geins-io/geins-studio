# Products Domain

> Product catalog management: products, SKUs, media, categories, and brands.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Products domain is the foundational data layer for the commerce backend. It manages the product catalog — including SKUs, media assets, categories, and brands — and provides the product data that Pricing and Orders depend on.

## Key Concepts

**Product ↔ SKU relationship** — A Product is the merchandising entity (name, description, media, categories). Each Product has one or more SKUs (stock-keeping units) representing purchasable variants with their own article number, dimensions, weight, stock levels, and GTIN.

**Localization** — Product names/texts are stored per-language in a `localizations` map (`Localized<Localizations>`). The products store transforms these using the current app language.

**Channels & Markets** — Products are scoped to channels. Prices are nested by channel → currency → country (`CurrencyConverted<ProductPrice>`). API queries accept `defaultChannel`, `defaultCurrency`, `defaultCountry`, `defaultLocale` to control which context's data is returned.

**Field selection** — The API supports granular field filtering via `ProductFieldsFilter`: `all`, `skus`, `media`, `prices`, `categories`, `channels`, `localizations`, `campaigns`, `attributes`, `relatedproducts`, `variant`, `brand`, `supplier`, `stock`. Callers should request only the fields they need.

## API Shape

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/product/query` | POST | Batch query products with selection filters |
| `/product/{id}` | GET | Single product |
| `/product/category/query` | POST | Query categories |
| `/product/brand/query` | POST | Query brands |
| `/product/pricelist/*` | CRUD | Price list management (see Pricing domain) |

**`ProductApiOptions`** extends the base `ApiOptions` with extra string params forwarded as query parameters: `defaultChannel`, `defaultCurrency`, `defaultCountry`, `defaultLocale`, `currencies`, `localizations`.

**Batch query** — Products use POST-based batch queries (not GET list endpoints). The `productRepo.list()` and `productRepo.query()` methods both call `/product/query` with different selection bodies.

**Product selection filters** (`SelectorSelectionQuery`) — `channelIds`, `currencyIds`, `countryIds`, `categoryIds`, `brandIds`, `productIds`, `price`, `stock`. Used by the quotation product selector to filter products matching the quotation's channel and currency.

## Contracts (Cross-Domain Usage)

| Type | Used By | Purpose |
| --- | --- | --- |
| `Product` | Orders (quotation items) | SKU selection and display |
| `ProductPriceList` | Pricing, Customers | Price list CRUD and company assignment |
| `PriceListProduct` | Pricing | Per-product pricing within a price list |
| `Category`, `Brand` | Pricing (product selector) | Filtering products in selectors |
| `ProductApiOptions` | Orders | Querying products with channel/currency context |

## Dependencies

- **Depends on**: None (foundational domain)
- **Depended on by**: Pricing (price lists, product prices), Orders (SKU selection for quotation items), Customers (price list associations)

## Key Files

| Layer | Path |
| --- | --- |
| Types | `shared/types/Product.ts` |
| Repository | `app/utils/repositories/product.ts` |
| Store | `app/stores/products.ts` |
| Composables | `useSelector.ts`, `useGeinsImage.ts` |
| Components | `app/components/selector/` |

## Decision Log

**2024-06-13: Products store as global cache**
Products, categories, and brands are cached in a Pinia store initialized on login. Avoids re-fetching on every page navigation and supports localization transforms when the app language changes.

**2025-01-01: POST-based batch queries instead of GET list endpoints**
The product API uses `POST /product/query` with selection filters in the request body. This supports complex filtering (channels, currencies, categories, brands, price ranges, stock) that would be unwieldy as query parameters.
