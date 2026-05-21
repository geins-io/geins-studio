# Domain Audit

> Complete mapping of source files to business domains. Created 2026-03-19.

## Domain Distribution

| Domain | Files | Key Areas |
|---|---|---|
| **Infrastructure** | ~106 (30%) | UI primitives, composables (useEntityEdit, useTable, useColumns), layout, auth guard, error handling |
| **Orders** | ~68 (19%) | Quotation pages, messaging, changelog, status transitions, price summary |
| **Products** | ~48 (13%) | Product API, SKU selector, image handling, product table cells |
| **Pricing** | ~42 (12%) | Price list pages, volume pricing, rules, price mode cells |
| **Customers** | ~38 (11%) | Company pages, buyers, address forms, company orders |
| **Account/Auth** | ~28 (8%) | Login, profile, user management, password reset, auth state |
| **Ambiguous** | ~22 (6%) | Components used across multiple domains |

---

## `app/composables/`

| File | Domain | Notes |
|---|---|---|
| useEntityEdit.ts | Infrastructure | Universal entity CRUD lifecycle |
| useEntityEditSummary.ts | Infrastructure | Edit page sidebar summary |
| useEntityUrl.ts | Infrastructure | Entity URL generation |
| useTable.ts | Infrastructure | TanStack Table wrapper |
| useColumns.ts | Infrastructure | Dynamic column definitions |
| useSelector.ts | Infrastructure | Reusable selector state |
| useSkeleton.ts | Infrastructure | Table skeleton loading |
| useBatchQuery.ts | Infrastructure | Batch API queries |
| useDeleteDialog.ts | Infrastructure | Delete confirmation logic |
| usePageError.ts | Infrastructure | Page error handling |
| useStepManagement.ts | Infrastructure | Multi-step form logic |
| useLayout.ts | Infrastructure | Layout state (sidebar) |
| useDate.ts | Infrastructure | Date formatting |
| usePrice.ts | Infrastructure | Price formatting |
| useGeinsLog.ts | Infrastructure | Scoped logging |
| useGeinsApi.ts | Infrastructure | API client composable |
| useGeinsRepository.ts | Infrastructure | Repository factory injection |
| useNavigation.ts | Infrastructure | App navigation |
| usePageTitle.ts | Infrastructure | Page title management |
| useUnsavedChanges.ts | Infrastructure | Unsaved changes tracking |
| useGeinsAuth.ts | Account/Auth | Authentication state |
| useGeinsImage.ts | Products | Image URL generation |
| useCustomerCompanies.ts | Customers | Company management utils |
| useCompanyOrders.ts | Orders | Company order history |
| usePriceListProducts.ts | Pricing | Price list products |
| usePriceListProductsTable.ts | Pricing | Price list products table |
| usePriceListRules.ts | Pricing | Pricing rules logic |
| usePriceListVolumePricing.ts | Pricing | Volume pricing logic |
| usePriceListPreview.ts | Pricing | Price list preview |

## `app/utils/repositories/`

| File | Domain | Notes |
|---|---|---|
| entity-base.ts | Infrastructure | Base CRUD factory |
| entity.ts | Infrastructure | Extended CRUD factory |
| global.ts | Infrastructure | Account, channels, currencies, languages |
| changelog.ts | Infrastructure | Changelog API (used across domains) |
| product.ts | Products | Product + price list API |
| customer.ts | Customers | Company, buyer, VAT validation |
| order.ts | Orders | Order + quotation API |
| user.ts | Account/Auth | User + profile API |

## `app/stores/`

| File | Domain | Notes |
|---|---|---|
| account.ts | Account/Auth | Account settings, channels, currencies |
| user.ts | Account/Auth | Current user state |
| products.ts | Products | Cached products, categories, brands |
| breadcrumbs.ts | Infrastructure | Navigation breadcrumbs |

## `app/components/` (domain components only)

| Directory | Domain | Key Components |
|---|---|---|
| auth/ | Account/Auth | AuthForm.vue |
| company/ | Customers | CompanyBuyerPanel.vue |
| price-list/ | Pricing | PriceListPriceModeCell, PriceListRule, PriceListRules, PriceListRulesWrapper, PriceListVolumePricingCell, PriceListVolumePricingPanel |
| quotation/ | Orders | QuotationChangelog, QuotationCommunications, QuotationMessageCompose, QuotationMessageThread |
| content/quotation/ | Orders | ContentQuotationCustomerDisplay, ContentQuotationWorkflowInfo |

## `app/components/` (infrastructure)

| Directory | Classification | Notes |
|---|---|---|
| ui/ | Infrastructure | ~240 shadcn-vue primitives (CLI-installed) |
| content/ | Infrastructure | ContentEditCard, ContentSwitch, ContentAddressDisplay, etc. |
| content/edit/ | Infrastructure | ContentEditMain, ContentEditWrap, ContentEditTabs, etc. |
| content/text/ | Infrastructure | ContentTextCopy, ContentTextTooltip |
| dialog/ | Infrastructure | DialogDelete, DialogUnsavedChanges |
| table/ | Infrastructure | TableView, TablePagination, TableColumnToggle |
| table/cell/ | Infrastructure | TableCellActions, TableCellCurrency, TableCellEditable, etc. |
| table/header/ | Infrastructure | TableHeaderSort |
| form/ | Infrastructure | FormGrid, FormGridWrap |
| form/input/ | Infrastructure | FormInputChannels, FormInputDate, FormInputSelectSearch, etc. |
| form/item/ | Infrastructure | FormItemSwitch |
| selector/ | Infrastructure | Selector, SelectorPanel, SelectorHeader, SelectorTag, etc. |
| layout/ | Infrastructure | LayoutHeader |
| layout/sidebar/ | Infrastructure | LayoutSidebar, LayoutSidebarUser |
| sidebar/ | Infrastructure | SidebarNav, SidebarNavItem |
| button/ | Infrastructure | ButtonExport, ButtonIcon |
| error/ | Infrastructure | 404.vue, 500.vue |
| feedback/ | Infrastructure | Feedback.vue |

## `app/components/` (ambiguous)

| Component | Current | Notes |
|---|---|---|
| ContentPriceSummary.vue | Orders | Used only in quotation edit, but could be reusable for any price summary |
| ContentEditCustomerPanel.vue | Orders | Quotation customer panel, but address/buyer patterns are reusable |
| ContentEditAddressPanel.vue | Infrastructure | Address editing used by both Customers and Orders |
| ContentAddressDisplay.vue | Infrastructure | Address display used by both Customers and Orders |
| DialogStatusTransition.vue | Orders | Status transition dialog, currently quotation-only |
| TableCellProduct.vue | Products | Product display cell, used by Orders and Pricing too |
| LayoutSidebarUser.vue | Account/Auth | User profile in sidebar, infrastructure-adjacent |

## `shared/types/`

| File | Domain | Notes |
|---|---|---|
| Global.ts | Infrastructure | EntityBase, Address, Channel, Currency, Market, Language, Price |
| Api.ts | Infrastructure | API error, query, batch types |
| Table.ts | Infrastructure | TableMode, column types |
| Selector.ts | Infrastructure | Selector state types |
| Changelog.ts | Infrastructure | ChangelogEntry type |
| index.ts | Infrastructure | Re-exports |
| next-auth.d.ts | Account/Auth | NextAuth type augmentation |
| Auth.ts | Account/Auth | Session, credentials, tokens |
| Account.ts | Account/Auth | Account, Channel types |
| Product.ts | Products | Product, SKU, PriceList types (includes Pricing types) |
| Customer.ts | Customers | Company, Buyer, SalesRep types |
| Order.ts | Orders | Order types |
| Quotation.ts | Orders | Quotation lifecycle types |

## `shared/utils/`

| File | Domain | Notes |
|---|---|---|
| log.ts | Infrastructure | Scoped logging |
| api-query.ts | Infrastructure | Query builder |
| deployment.ts | Infrastructure | Environment detection |

## `app/plugins/`

| File | Domain | Notes |
|---|---|---|
| geins-api.ts | Infrastructure | API client init |
| geins-global.ts | Infrastructure | Global app setup |
| error-handler.ts | Infrastructure | Error catching |
| auth-state.ts | Account/Auth | Auth state init |
| click-outside.client.ts | Infrastructure | Directive |
| click-outside.server.ts | Infrastructure | SSR stub |
| suppress-devtools-warn.client.ts | Infrastructure | Dev helper |

## Key Observations

1. **Infrastructure dominates** — 30% of files are shared/reusable, which is healthy for an admin SPA.
2. **Orders is the largest feature domain** — Quotations have the most complex UI (messaging, changelog, status workflows, preview).
3. **Pricing composables are the most numerous** — 5 domain-specific composables, reflecting complex business logic.
4. **`Product.ts` contains Pricing types** — Price list types are colocated with product types (documented decision).
5. **Clean page structure** — Pages are already domain-grouped under `pages/{domain}/{entity}/`.
6. **Composable candidates for subdirectories**: Pricing (5 files), Customers (1), Orders (1), Products (1), Account/Auth (1).
