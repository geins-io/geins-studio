# Changelog

## v0.4.2 - 2026-06-02

### 🚀 Enhancements

- Domain-based branding — Geins Studio / Litium Studio ([#247](https://github.com/geins-io/geins-studio/pull/247))
- Price list — add identifier field, show API error titles in toasts ([#251](https://github.com/geins-io/geins-studio/pull/251))
- Storefront — update default settings & widen payment logo type ([#235](https://github.com/geins-io/geins-studio/pull/235))
- Channels — WCAG AA contrast warning + storefront schema polish ([#233](https://github.com/geins-io/geins-studio/pull/233))
- Azure infrastructure, Dockerfile, deploy workflow & `/api/health` endpoint

### 🐛 Bug Fixes

- Restore combobox tab order and selection focus return ([#252](https://github.com/geins-io/geins-studio/pull/252))
- Suppress Mails tab error dot on initial load ([#250](https://github.com/geins-io/geins-studio/pull/250))
- Fix required field rules on company form ([#249](https://github.com/geins-io/geins-studio/pull/249))
- Image remove, channel name race, account sort & active counts ([#245](https://github.com/geins-io/geins-studio/pull/245))
- Allow clearing expiration date ([#244](https://github.com/geins-io/geins-studio/pull/244))
- Missing payment icons & JSON schema fallback ([#234](https://github.com/geins-io/geins-studio/pull/234))
- Align GHCR registry auth and secret names for deployment

### 🔄 Refactor

- Component naming + folder structure cleanup ([#232](https://github.com/geins-io/geins-studio/pull/232))

### 📖 Documentation

- Component documentation phases 1–4 ([#224](https://github.com/geins-io/geins-studio/pull/224), [#227](https://github.com/geins-io/geins-studio/pull/227), [#228](https://github.com/geins-io/geins-studio/pull/228), [#230](https://github.com/geins-io/geins-studio/pull/230))

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.4.1 - 2026-05-07

### 🐛 Bug Fixes

- Fixed potential mismatch between channel and market on quotation creation

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.4.0 - 2026-04-29

This release introduces full Channel entity management (Self-Service for Channels) and major architectural upgrades across documentation and governance.

### 🚀 Enhancements

- Channels — list page, edit page, and navigation ([#193](https://github.com/geins-io/geins-studio/pull/193), [#194](https://github.com/geins-io/geins-studio/pull/194), [#196](https://github.com/geins-io/geins-studio/pull/196))
- Channels — General tab with default & additional languages ([#210](https://github.com/geins-io/geins-studio/pull/210))
- Channels — Markets tab with default market and inline active toggle ([#211](https://github.com/geins-io/geins-studio/pull/211), [#217](https://github.com/geins-io/geins-studio/pull/217))
- Channels — Mails tab with content overrides, layout & live preview ([#214](https://github.com/geins-io/geins-studio/pull/214), [#216](https://github.com/geins-io/geins-studio/pull/216))
- Channels — Storefront Settings with JSON schema editor, default schema, SEO & Contact tabs ([#208](https://github.com/geins-io/geins-studio/pull/208), [#218](https://github.com/geins-io/geins-studio/pull/218))

### 🐛 Bug Fixes

- Account and AuthAccounts types updated to match current API shape ([#209](https://github.com/geins-io/geins-studio/pull/209))

### 🔄 Refactor

- Rename Channel fields displayName → name, name → identifier ([#202](https://github.com/geins-io/geins-studio/pull/202))

### 📖 Documentation

- Consolidate documentation hierarchy — ARCHITECTURE.md, APP.md, DOMAIN.md ([#178](https://github.com/geins-io/geins-studio/pull/178), [#179](https://github.com/geins-io/geins-studio/pull/179), [#181](https://github.com/geins-io/geins-studio/pull/181))
- Add forms guide for entity pages

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.3.2 - 2026-04-02

### 🐛 Bug Fixes

- Status badge always showing inactive regardless of entity live status

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.3.1 - 2026-03-16

### 🚀 Enhancements

- Extend quotation with new expiry date ([#166](https://github.com/geins-io/geins-studio/pull/166))
- Improved quotation changelog display ([#169](https://github.com/geins-io/geins-studio/pull/169))
- Action-specific toast messages for quotation status updates ([#171](https://github.com/geins-io/geins-studio/pull/171))

### 🐛 Bug Fixes

- Auto-save quotation items when pricelist prices have drifted ([#167](https://github.com/geins-io/geins-studio/pull/167))
- No changelog shown in draft mode ([#165](https://github.com/geins-io/geins-studio/pull/165))
- Sidebar overflow ([#164](https://github.com/geins-io/geins-studio/pull/164))

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.3.0 - 2026-03-11

This release introduces the full quotation lifecycle and major infrastructure upgrades.

### 🚀 Enhancements

- Quotation create & edit ([#132](https://github.com/geins-io/geins-studio/pull/132))
- Quotation sent mode ([#133](https://github.com/geins-io/geins-studio/pull/133))
- Quotation communications ([#137](https://github.com/geins-io/geins-studio/pull/137))
- Better error states for list page grids with inline retry ([#156](https://github.com/geins-io/geins-studio/pull/156))
- Dynamic browser tab titles derived from breadcrumb trail ([#158](https://github.com/geins-io/geins-studio/pull/158))

### 🐛 Bug Fixes

- Blur instead of submit on Enter in editable table cells ([#153](https://github.com/geins-io/geins-studio/pull/153))
- ComboboxList inline positioning inside Sheet ([#123](https://github.com/geins-io/geins-studio/pull/123))

### 🔄 Refactor

- Migrate to Nuxt 4 and Node 24+ ([#122](https://github.com/geins-io/geins-studio/pull/122))

### 🏡 Chore

- Upgrade Node and migrate from Yarn to pnpm ([#124](https://github.com/geins-io/geins-studio/pull/124))
- Repository pruning — remove dead code, unused deps & stale config ([#125](https://github.com/geins-io/geins-studio/pull/125))
- Agent operability — tooling, conventions & documentation ([#126](https://github.com/geins-io/geins-studio/pull/126))

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
