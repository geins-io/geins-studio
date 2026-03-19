---
name: sync-domain
description: "Scan a domain's code and generate proposed documentation updates for its DOMAIN.md file. Use when domain code has changed and docs may be out of sync. Accepts a domain name: products, customers, orders, pricing, account-auth."
---

# Sync Domain Documentation

Reads a domain's source code and compares it against the existing `docs/domains/{domain}.md`. Outputs a proposed diff — does NOT write to files directly.

See `CLAUDE.md` → "Further Reading" for the documentation hierarchy.

## Usage

```
/sync-domain [domain-name]
```

Domain names: `products`, `customers`, `orders`, `pricing`, `account-auth`

## Domain File Map

| Domain       | Types                                                | Repository                                                           | Composables                  | Components                                                       | Pages                                   | Store                                         | Doc                            |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------------- | --------------------------------------------- | ------------------------------ |
| products     | `shared/types/Product.ts`                            | `app/utils/repositories/product.ts`                                  | `app/composables/products/`  | `app/components/selector/`                                       | —                                       | `app/stores/products.ts`                      | `docs/domains/products.md`     |
| customers    | `shared/types/Customer.ts`                           | `app/utils/repositories/customer.ts`                                 | `app/composables/customers/` | `app/components/company/`                                        | `app/pages/customers/`                  | —                                             | `docs/domains/customers.md`    |
| orders       | `shared/types/Order.ts`, `shared/types/Quotation.ts` | `app/utils/repositories/order.ts`                                    | `app/composables/orders/`    | `app/components/quotation/`, `app/components/content/quotation/` | `app/pages/orders/`                     | —                                             | `docs/domains/orders.md`       |
| pricing      | `shared/types/Product.ts` (price list types)         | `app/utils/repositories/product.ts` (`.priceList`)                   | `app/composables/pricing/`   | `app/components/price-list/`                                     | `app/pages/pricing/`                    | —                                             | `docs/domains/pricing.md`      |
| account-auth | `shared/types/Auth.ts`, `shared/types/Account.ts`    | `app/utils/repositories/user.ts`, `app/utils/repositories/global.ts` | `app/composables/auth/`      | `app/components/auth/`                                           | `app/pages/auth/`, `app/pages/account/` | `app/stores/account.ts`, `app/stores/user.ts` | `docs/domains/account-auth.md` |

Scope shared files carefully:
- `pricing` and `products` both read from `shared/types/Product.ts` and `app/utils/repositories/product.ts`, but they document different subdomains.
- For `pricing`, only extract price-list-related contracts and APIs, such as `PriceList*`, `PriceRule*`, and methods under `.priceList`. Ignore product/catalog/SKU/category contracts that are unrelated to pricing behavior.
- For `products`, focus on product/catalog/SKU/category contracts and product-facing repository methods. Ignore pricing-only contracts and `.priceList` methods unless the products doc already treats them as a dependency.

## Workflow

### Step 1 — Scan domain code

For the given domain, read all files from the Domain File Map above. Extract:

1. **Exported types**: All `export interface`, `export type` from the type files
	- If a mapped type file is shared across domains, filter the exported types to the current domain's subdomain instead of treating the entire file as in-scope.
	- For `pricing`, keep only price-list/pricing contracts from `shared/types/Product.ts`.
	- For `products`, keep only product/catalog/SKU/category contracts from `shared/types/Product.ts`.
2. **Repository methods**: All public methods from the repository file
	- If a mapped repository file is shared across domains, keep only the methods relevant to the current domain.
	- For `pricing`, inspect `app/utils/repositories/product.ts` only for `.priceList` methods.
	- For `products`, inspect `app/utils/repositories/product.ts` for product-facing methods and treat `.priceList` methods as out of scope unless they are explicitly documented as dependencies.
3. **Composable exports**: All exported functions from composable files
4. **Component list**: All `.vue` files in the component directories
5. **Cross-domain imports**: Any imports from other domain's type files

### Step 2 — Read existing documentation

Read the domain's `docs/domains/{domain}.md` file.

### Step 3 — Compare and identify drift

Check for:

- **New types** not mentioned in the doc's "Contracts" or "Key Concepts" sections
- **Removed types** still documented but no longer in the code
- **New composables** not listed in "Key Files"
- **New components** not listed in "Key Files"
- **Changed API endpoints** (new repository methods not documented)
- **Dependency changes** (new cross-domain imports not listed in "Dependencies")
- **API shape changes** (type fields that differ from documented shapes in "API Shape Quirks")

### Step 4 — Output proposed diff

Format the output as a markdown diff proposal:

```markdown
## Proposed Updates to docs/domains/{domain}.md

### New content to add

**Key Concepts section:**

- Add: `NewConcept` — description based on code analysis

**Contracts table:**
| Type | Used By | Purpose |
| `NewType` | ... | ... |

**Key Files table:**
| Layer | Path |
| Composables | `app/composables/{domain}/newFile.ts` |

### Content to update

**API Shape Quirks:**

- `fieldName` — documented as X, actual type is Y

### Content to remove

- `OldType` — no longer exists in `shared/types/{Domain}.ts`
```

### Step 5 — Present for review

Present the proposed diff to the user. Do NOT modify any files. The user decides which changes to apply.

## Important

- This skill is **read-only** — it proposes changes, never writes them
- Focus on domain-level knowledge (business rules, API shapes, contracts), not implementation details
- Keep proposals concise — only flag meaningful drift, not cosmetic differences
- If no drift is found, report "Documentation is in sync with code"
