# Changelog

## v0.6.0 - 2026-10-20

### 🚀 Enhancements

- **Assets library** — new Assets section for images and files on the Geins.Media API: grid and list browser with a folder tree, server-side paging, sorting and search, type, channel and modified filters, and scaled previews ([#291](https://github.com/geins-io/geins-studio/pull/291), [#299](https://github.com/geins-io/geins-studio/pull/299), [#300](https://github.com/geins-io/geins-studio/pull/300), [#301](https://github.com/geins-io/geins-studio/pull/301), [#303](https://github.com/geins-io/geins-studio/pull/303), [#304](https://github.com/geins-io/geins-studio/pull/304), [#305](https://github.com/geins-io/geins-studio/pull/305), [#317](https://github.com/geins-io/geins-studio/pull/317), [#323](https://github.com/geins-io/geins-studio/pull/323), [#324](https://github.com/geins-io/geins-studio/pull/324), [#326](https://github.com/geins-io/geins-studio/pull/326), [#329](https://github.com/geins-io/geins-studio/pull/329), [#331](https://github.com/geins-io/geins-studio/pull/331), [#334](https://github.com/geins-io/geins-studio/pull/334), [#336](https://github.com/geins-io/geins-studio/pull/336), [#388](https://github.com/geins-io/geins-studio/pull/388), [#395](https://github.com/geins-io/geins-studio/pull/395), [#401](https://github.com/geins-io/geins-studio/pull/401), [#404](https://github.com/geins-io/geins-studio/pull/404), [#436](https://github.com/geins-io/geins-studio/pull/436))
- Assets — folders: create, rename, move and delete from the folder rail, including non-empty folders via trash, relocate or purge ([#306](https://github.com/geins-io/geins-studio/pull/306), [#327](https://github.com/geins-io/geins-studio/pull/327), [#347](https://github.com/geins-io/geins-studio/pull/347), [#371](https://github.com/geins-io/geins-studio/pull/371), [#419](https://github.com/geins-io/geins-studio/pull/419), [#431](https://github.com/geins-io/geins-studio/pull/431))
- Assets — detail panel: name, per-language alt text and description, tags with autocomplete, channels, content languages, copy URL, download, replace file with a usage warning, and "Where it's used" with product linking ([#309](https://github.com/geins-io/geins-studio/pull/309), [#310](https://github.com/geins-io/geins-studio/pull/310), [#311](https://github.com/geins-io/geins-studio/pull/311), [#312](https://github.com/geins-io/geins-studio/pull/312), [#319](https://github.com/geins-io/geins-studio/pull/319), [#322](https://github.com/geins-io/geins-studio/pull/322), [#338](https://github.com/geins-io/geins-studio/pull/338), [#368](https://github.com/geins-io/geins-studio/pull/368), [#369](https://github.com/geins-io/geins-studio/pull/369), [#376](https://github.com/geins-io/geins-studio/pull/376), [#381](https://github.com/geins-io/geins-studio/pull/381), [#385](https://github.com/geins-io/geins-studio/pull/385), [#406](https://github.com/geins-io/geins-studio/pull/406), [#408](https://github.com/geins-io/geins-studio/pull/408), [#411](https://github.com/geins-io/geins-studio/pull/411), [#413](https://github.com/geins-io/geins-studio/pull/413), [#422](https://github.com/geins-io/geins-studio/pull/422))
- Assets — upload: quick upload dialog and a three-step upload wizard with bulk metadata and auto-linking to products, all carried on the upload ticket ([#308](https://github.com/geins-io/geins-studio/pull/308), [#339](https://github.com/geins-io/geins-studio/pull/339), [#340](https://github.com/geins-io/geins-studio/pull/340), [#341](https://github.com/geins-io/geins-studio/pull/341), [#342](https://github.com/geins-io/geins-studio/pull/342), [#349](https://github.com/geins-io/geins-studio/pull/349), [#352](https://github.com/geins-io/geins-studio/pull/352), [#354](https://github.com/geins-io/geins-studio/pull/354), [#370](https://github.com/geins-io/geins-studio/pull/370), [#379](https://github.com/geins-io/geins-studio/pull/379), [#433](https://github.com/geins-io/geins-studio/pull/433))
- Assets — asset picker: browse-and-select panel any page can open, with folder navigation, server-side search and inline quick upload ([#358](https://github.com/geins-io/geins-studio/pull/358), [#359](https://github.com/geins-io/geins-studio/pull/359), [#361](https://github.com/geins-io/geins-studio/pull/361), [#362](https://github.com/geins-io/geins-studio/pull/362), [#364](https://github.com/geins-io/geins-studio/pull/364), [#365](https://github.com/geins-io/geins-studio/pull/365), [#397](https://github.com/geins-io/geins-studio/pull/397))
- Assets — bulk actions: select across pages, then move to trash, move to folder, add tags or channels, link to products as image or file, or download as a zip ([#405](https://github.com/geins-io/geins-studio/pull/405), [#407](https://github.com/geins-io/geins-studio/pull/407), [#412](https://github.com/geins-io/geins-studio/pull/412), [#415](https://github.com/geins-io/geins-studio/pull/415), [#418](https://github.com/geins-io/geins-studio/pull/418), [#427](https://github.com/geins-io/geins-studio/pull/427), [#430](https://github.com/geins-io/geins-studio/pull/430))
- Assets — trash: restore, delete permanently, empty trash, restore and purge trashed folders, and sort by deleted and purge dates ([#372](https://github.com/geins-io/geins-studio/pull/372), [#378](https://github.com/geins-io/geins-studio/pull/378), [#396](https://github.com/geins-io/geins-studio/pull/396), [#416](https://github.com/geins-io/geins-studio/pull/416), [#417](https://github.com/geins-io/geins-studio/pull/417), [#426](https://github.com/geins-io/geins-studio/pull/426))
- Assets — background jobs panel for replace, moves, purges and folder deletes, plus a storage usage bar and details panel ([#351](https://github.com/geins-io/geins-studio/pull/351), [#421](https://github.com/geins-io/geins-studio/pull/421), [#424](https://github.com/geins-io/geins-studio/pull/424), [#428](https://github.com/geins-io/geins-studio/pull/428), [#429](https://github.com/geins-io/geins-studio/pull/429))
- **Orchestrator** — execution and step errors on the execution page, step list, workflow editor and executions list ([#425](https://github.com/geins-io/geins-studio/pull/425))
- Server-side lists — `useListQuery` with route-query sync, `TableView` `dataSource="server"` with selection kept across pages, and a filter toolbar with value panels and an "All filters" sheet ([#389](https://github.com/geins-io/geins-studio/pull/389), [#390](https://github.com/geins-io/geins-studio/pull/390), [#391](https://github.com/geins-io/geins-studio/pull/391), [#392](https://github.com/geins-io/geins-studio/pull/392), [#393](https://github.com/geins-io/geins-studio/pull/393), [#394](https://github.com/geins-io/geins-studio/pull/394), [#398](https://github.com/geins-io/geins-studio/pull/398), [#399](https://github.com/geins-io/geins-studio/pull/399))
- Panels — reusable slide-in edit panel with panel-on-panel stacking, a global translation panel and a reusable `FormTranslatableField` ([#295](https://github.com/geins-io/geins-studio/pull/295), [#296](https://github.com/geins-io/geins-studio/pull/296), [#297](https://github.com/geins-io/geins-studio/pull/297), [#320](https://github.com/geins-io/geins-studio/pull/320), [#321](https://github.com/geins-io/geins-studio/pull/321))
- Tinted color variants for `Badge` ([#298](https://github.com/geins-io/geins-studio/pull/298))

### 🐛 Bug Fixes

- Token refresh no longer resets the account and products stores ([#420](https://github.com/geins-io/geins-studio/pull/420))
- Default UI language follows the account's channel default instead of English ([#337](https://github.com/geins-io/geins-studio/pull/337))
- Partially checked checkboxes show a filled minus ([#437](https://github.com/geins-io/geins-studio/pull/437))
- Sans-serif font fallback and preloaded app fonts ([#435](https://github.com/geins-io/geins-studio/pull/435))
- Dev-only pages excluded from production builds unless `INCLUDE_DEV_PAGES=true` ([#382](https://github.com/geins-io/geins-studio/pull/382))
- No false unsaved-changes prompt when a panel opens; entity name resolved in the delete-confirm message ([#318](https://github.com/geins-io/geins-studio/pull/318), [#375](https://github.com/geins-io/geins-studio/pull/375))
- Assets — browse polish, SVG previews, broken-thumbnail fallback, segmented toggle in dark mode, matching loading skeletons, folder tree and "Used in" rows kept on refresh ([#313](https://github.com/geins-io/geins-studio/pull/313), [#314](https://github.com/geins-io/geins-studio/pull/314), [#315](https://github.com/geins-io/geins-studio/pull/315), [#325](https://github.com/geins-io/geins-studio/pull/325), [#348](https://github.com/geins-io/geins-studio/pull/348), [#353](https://github.com/geins-io/geins-studio/pull/353), [#402](https://github.com/geins-io/geins-studio/pull/402), [#403](https://github.com/geins-io/geins-studio/pull/403), [#438](https://github.com/geins-io/geins-studio/pull/438), [#439](https://github.com/geins-io/geins-studio/pull/439))
- Assets — cancel a new folder, moved assets under Uncategorised, unsaved folder name committed on upload, folder and trash filters respected, uploads blocked by a trashed asset explained, wizard polish, app-init crash ([#316](https://github.com/geins-io/geins-studio/pull/316), [#328](https://github.com/geins-io/geins-studio/pull/328), [#335](https://github.com/geins-io/geins-studio/pull/335), [#343](https://github.com/geins-io/geins-studio/pull/343), [#350](https://github.com/geins-io/geins-studio/pull/350), [#380](https://github.com/geins-io/geins-studio/pull/380), [#384](https://github.com/geins-io/geins-studio/pull/384), [#414](https://github.com/geins-io/geins-studio/pull/414))
- Tests & dev tooling — no flaky whole-file failures from the test env boot timeout, root-anchored scratch-dir watcher ignores ([#410](https://github.com/geins-io/geins-studio/pull/410), [#423](https://github.com/geins-io/geins-studio/pull/423))

### 🔄 Refactor

- Assets — moved from a Supabase mock to the Geins.Media API: asset and folder repositories, wire shapes, list query, Uncategorised as a root query, then retired the mock and capability flags ([#290](https://github.com/geins-io/geins-studio/pull/290), [#292](https://github.com/geins-io/geins-studio/pull/292), [#293](https://github.com/geins-io/geins-studio/pull/293), [#307](https://github.com/geins-io/geins-studio/pull/307), [#344](https://github.com/geins-io/geins-studio/pull/344), [#345](https://github.com/geins-io/geins-studio/pull/345), [#346](https://github.com/geins-io/geins-studio/pull/346), [#366](https://github.com/geins-io/geins-studio/pull/366), [#367](https://github.com/geins-io/geins-studio/pull/367), [#374](https://github.com/geins-io/geins-studio/pull/374), [#377](https://github.com/geins-io/geins-studio/pull/377), [#383](https://github.com/geins-io/geins-studio/pull/383), [#434](https://github.com/geins-io/geins-studio/pull/434))
- Shared `Tag` component, asset library i18n namespace, asset test coverage ([#302](https://github.com/geins-io/geins-studio/pull/302), [#330](https://github.com/geins-io/geins-studio/pull/330), [#333](https://github.com/geins-io/geins-studio/pull/333))

### 📖 Documentation

- Assets domain doc — contract, swap plan, folder delete and trash semantics ([#294](https://github.com/geins-io/geins-studio/pull/294), [#332](https://github.com/geins-io/geins-studio/pull/332), [#373](https://github.com/geins-io/geins-studio/pull/373), [#432](https://github.com/geins-io/geins-studio/pull/432))
- Agent skills — Linear skills renamed to `geins-*`, planning skill, skill invocation rules, PR review and parallel worktrees ([#355](https://github.com/geins-io/geins-studio/pull/355), [#356](https://github.com/geins-io/geins-studio/pull/356), [#357](https://github.com/geins-io/geins-studio/pull/357), [#360](https://github.com/geins-io/geins-studio/pull/360), [#363](https://github.com/geins-io/geins-studio/pull/363), [#409](https://github.com/geins-io/geins-studio/pull/409))

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))
- 🧙‍♂️mandery ([@jmandery](https://github.com/jmandery))

## v0.5.1 - 2026-09-29

### 🐛 Bug Fixes

- **Channels** — applying an edited storefront schema no longer wipes saved settings. A new apply dialog offers "Apply only changes" (default: only new or changed fields are affected, settings without a field are kept unless you remove them) or "Apply and reset defaults" ([#386](https://github.com/geins-io/geins-studio/pull/386))

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))

## v0.5.0 - 2026-07-02

### 🚀 Enhancements

- **Orchestrator** — new visual workflow automation: build, run & monitor workflows with a Blockly-based editor, integration kits & Settings › Orchestrator config ([#254](https://github.com/geins-io/geins-studio/pull/254))
- Nuxt 4.4 upgrade — async-data & runtime fixes ([#271](https://github.com/geins-io/geins-studio/pull/271))
- App version meta tag & build info

### 🐛 Bug Fixes

- Address false unsaved-changes + optional name/email fields ([#267](https://github.com/geins-io/geins-studio/pull/267))
- Stable sidebar logo across collapse + white-label sizing ([#266](https://github.com/geins-io/geins-studio/pull/266))
- Restore SelectorQuickAdd width on company price lists, strip cache-busting query string from image file names, logo sizing fixes
- Deploy — inline Bicep parameters, stop Bicep updating production container directly, `NUXT_PUBLIC_BASE_URL` runtime override

### 🔄 Refactor

- Entity registry as the single source of truth — endpoints, routes & i18n keys declared once; composables take the registry entry; orchestrator repo aligned ([#277](https://github.com/geins-io/geins-studio/pull/277), [#278](https://github.com/geins-io/geins-studio/pull/278), [#285](https://github.com/geins-io/geins-studio/pull/285))
- Entity URLs restructured — pluralized paths, dropped `/list`, registry-keyed list-column links ([#279](https://github.com/geins-io/geins-studio/pull/279), [#280](https://github.com/geins-io/geins-studio/pull/280))
- Renamed `entityName` → `entityKey` across code & docs ([#286](https://github.com/geins-io/geins-studio/pull/286))
- Consolidated API error toasts onto one global handler ([#284](https://github.com/geins-io/geins-studio/pull/284))
- Prettier formatting baseline + automated enforcement ([#257](https://github.com/geins-io/geins-studio/pull/257))

### ❤️ Contributors

- Olivia Axelsson ([@olivia-geins](https://github.com/olivia-geins))
- Kristian Arvidsson ([@arvidsson-geins](https://github.com/arvidsson-geins))

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
