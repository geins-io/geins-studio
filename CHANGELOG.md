# Changelog

## v0.3.0 - 2026-03-11

This release introduces the full quotation lifecycle, communications, and major infrastructure upgrades.

### 🚀 Enhancements

- Quotation create & edit with live price preview ([#132](https://github.com/geins-io/geins-studio/pull/132))
- Quotation sent mode — read-only UI for non-draft statuses ([#133](https://github.com/geins-io/geins-studio/pull/133))
- Quotation communications — threaded messages with customer and internal types ([#137](https://github.com/geins-io/geins-studio/pull/137))
- Status transition messages attached to quotation actions ([#144](https://github.com/geins-io/geins-studio/pull/144))
- Better error states for list page grids with inline retry ([#156](https://github.com/geins-io/geins-studio/pull/156))
- Dynamic browser tab titles derived from breadcrumb trail ([#158](https://github.com/geins-io/geins-studio/pull/158))

### 🐛 Bug Fixes

- Sync draft quotation addresses with live company data ([#149](https://github.com/geins-io/geins-studio/pull/149))
- Only show active buyers and companies in selectors
- Price list price not set when assigning to company
- Table pagination select auto width
- Min value for expiration date picker ([#148](https://github.com/geins-io/geins-studio/pull/148))
- Blur instead of submit on Enter in editable table cells ([#153](https://github.com/geins-io/geins-studio/pull/153))
- ComboboxList inline positioning inside Sheet ([#123](https://github.com/geins-io/geins-studio/pull/123))

### 🔄 Refactor

- Migrate to Nuxt 4 and Node 22+ ([#122](https://github.com/geins-io/geins-studio/pull/122))
- Merge DialogConfirmSend into DialogStatusTransition ([#150](https://github.com/geins-io/geins-studio/pull/150))
- Unify QuotationAddress with standard Address type ([#139](https://github.com/geins-io/geins-studio/pull/139))
- SKU items flow — single source of truth for item data ([#146](https://github.com/geins-io/geins-studio/pull/146))
- Remove Market column from Quotations list ([#140](https://github.com/geins-io/geins-studio/pull/140))

### 🏡 Chore

- Upgrade Node and migrate from Yarn to pnpm ([#124](https://github.com/geins-io/geins-studio/pull/124))
- Repository pruning — remove dead code, unused deps & stale config ([#125](https://github.com/geins-io/geins-studio/pull/125))
- Agent operability — tooling, conventions & documentation ([#126](https://github.com/geins-io/geins-studio/pull/126))

### 📚 Docs

- Document list page error handling and TableView error state
- Add usePageTitle composable documentation
- Update features list with new capabilities
- Add missing JSDoc to composable return type interfaces

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.2.0 - 2026-01-14

This is a major release with significant refactoring and new features ([#120](https://github.com/geins-io/geins-studio/pull/120)).

### 🚀 Enhancements

- Expanding grids + SKU in selector panel ([#117](https://github.com/geins-io/geins-studio/pull/117))
- Added missing language keys ([#114](https://github.com/geins-io/geins-studio/pull/114))
- New login design ([#113](https://github.com/geins-io/geins-studio/pull/113))
- Added Swedish (sv) locale with complete translations

### 🔄 Refactor

- Renamed "Account" to "Company" throughout the application ([#118](https://github.com/geins-io/geins-studio/pull/118))
- Removed and renamed wholesale scope ([#115](https://github.com/geins-io/geins-studio/pull/115))

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.1.5 - 2025-12-17

### 🚀 Enhancements

- Ability to assign price list to buyer ([#108](https://github.com/geins-io/geins-studio/pull/108))
- Account picker + always using channel display name ([#109](https://github.com/geins-io/geins-studio/pull/109))
- Improved error pages ([#110](https://github.com/geins-io/geins-studio/pull/110))
- Adjusted dark mode colors ([#111](https://github.com/geins-io/geins-studio/pull/111))

### 🐛 Bug Fixes

- Fixed maximum height for auth account list

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.1.4 - 2025-12-04

### 🚀 Enhancements

- User profile management ([#104](https://github.com/geins-io/geins-studio/pull/104))
- Updated navigation structure with improved breadcrumbs ([#104](https://github.com/geins-io/geins-studio/pull/104))
- Authentication accounts from user endpoint ([#105](https://github.com/geins-io/geins-studio/pull/105))
- Search functionality in all grids ([#106](https://github.com/geins-io/geins-studio/pull/106))
- Empty states for grids ([#106](https://github.com/geins-io/geins-studio/pull/106))
- Password requirements validation

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.1.3 - 2025-11-25

### 🐛 Bug Fixes

- Fixed error when saving account because of API update

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.1.2 - 2025-11-11

### 🔄 Refactor

- Standardized naming conventions for price lists and volume pricing ([#100](https://github.com/geins-io/geins-studio/pull/100))

### 🐛 Bug Fixes

- Price mode change confirmation shown when it should

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.1.1 - 2025-10-22

### 🚀 Enhancements

- Orders grid for start page and Wholesale Accounts ([#96](https://github.com/geins-io/geins-studio/pull/96))

### 📚 Docs

- Updated Developer Docs with all missing features ([#97](https://github.com/geins-io/geins-studio/pull/97))
- Added missing JSDoc comments to composables ([#97](https://github.com/geins-io/geins-studio/pull/97))

### 🔄 Refactor

- Split price list edit to composables
- `useColumns` - options and types naming

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.1.0 - 2025-10-01

This release introduces wholesale accounts and price lists ([#95](https://github.com/geins-io/geins-studio/pull/95)).

### 🚀 Enhancements

- Syncing auth state across tabs ([#51](https://github.com/geins-io/geins-studio/pull/51))
- Product selector with advanced filtering ([#52](https://github.com/geins-io/geins-studio/pull/52))
- Wholesale Accounts ([#53](https://github.com/geins-io/geins-studio/pull/53))
- Repository pattern for entities with CRUD operations
- Wholesale Price Lists ([#54](https://github.com/geins-io/geins-studio/pull/54))
- Global price list rules ([#70](https://github.com/geins-io/geins-studio/pull/70))
- Vercel analytics + insights ([#72](https://github.com/geins-io/geins-studio/pull/72))
- Account orders tab + start page ([#84](https://github.com/geins-io/geins-studio/pull/84))
- UI responsive design ([#93](https://github.com/geins-io/geins-studio/pull/93))

### 🏡 Chore

- Upgrade to latest Nuxt and dependencies ([#55](https://github.com/geins-io/geins-studio/pull/55))
- Upgrade shadcn components ([#56](https://github.com/geins-io/geins-studio/pull/56))

### 🔄 Refactor

- Geins API repository composable

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))
