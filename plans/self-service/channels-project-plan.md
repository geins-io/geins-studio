# Channels — Project Plan

> **Figma**: [Self-service - Channels - UX handoff](https://www.figma.com/design/Ayaap7VbZKzPt4kjf2sFAp/Self-service---Channels---UX-handoff?node-id=0-1&p=f)
> **Date**: 2026-03-16
> **Status**: Draft — iterating before Linear import
>
> **Related docs**:
> - [Channels — Concept Documentation](./channels-concept.md) — domain model, relationships, and data flow
> - [Storefront Settings — Schema & Data Spec](./storefront-settings-schema-spec.md) — full schema types, default schema, renderer behavior
> - [Self Service Backend Plan](./self-service-backend-plan.md) — backend API implementation plan (geins-platform repo)

---

## Overview

Build the Channel entity management pages in Geins Studio. Channels represent sales channels (webshops, physical stores) and contain markets, languages, payment methods, mail templates, and storefront settings.

### Existing codebase state

- **Types**: `Channel`, `Market`, `Country`, `Language`, `Currency` exist in `shared/types/Account.ts`
- **API**: `globalRepo` has `channel.list()`, `currency.list()`, `language.list()` (read-only). No single-channel GET, no CRUD endpoints yet. These will be added alongside this project.
- **Store**: `accountStore` holds channels/currencies/languages, with helpers like `getChannelNameById()`
- **Components**: `FormInputChannels`, `FormInputCountrySelect`, `TableCellChannels` exist
- **Pages**: No channel pages exist yet

### Tab priority order

1. **Storefront settings** (highest priority — JSON schema-driven)
2. **General**
3. **Markets**
4. **Payments**
5. **Mails**

> Product search has been deferred (out of backend scope). See Milestone 8.

---

## Milestone 1: Foundation — Types, Repository & Channel CRUD

**Goal**: Establish the data layer and basic channel entity infrastructure.

### Tasks

- [ ] **1.1 Extend Channel types** (`shared/types/Channel.ts` — new file)
  - Define `ChannelResponse` (extends current `Channel` with additional API response fields)
  - Define `ChannelCreate` (name, displayName, type, location/URL, active)
  - Define `ChannelUpdate` (partial of create + ID)
  - Define `ChannelListItem` for list page (id, name, url, market count, status)
  - Keep existing `Channel` interface in `Account.ts` for backwards compatibility (used by accountStore)
  - Add `PaymentMethod`, `MailTemplate`, `StorefrontSettings` types as they become known from the API

- [ ] **1.2 Create channel API repository** (`app/utils/repositories/channel.ts`)
  - Use `entityRepo` factory chain (base → list → get → full CRUD)
  - **Primary channel endpoints** (all under `/account/` prefix):
    - `GET /account/channels` — list all channels
    - `GET /account/channel/{id}` — single channel with **all sub-entities** (languages, markets, payments, mail general/layout settings, storefront schema + settings)
    - `POST /account/channel` — create channel
    - `PATCH /account/channel/{id}` — **single write surface** (multipart/form-data) for channel properties AND all sub-entities: languages, market assignments, payment toggles, mail general/layout settings, storefront schema + settings, file uploads
    - `PUT /account/channel/{id}/activate` — set channel active
    - `PUT /account/channel/{id}/deactivate` — set channel inactive
  - **No DELETE** — channel deletion is not supported (RESOLVED)
  - **No COPY** — channel duplication is out of scope (RESOLVED)
  - **Market definition endpoints** (not channel sub-entities — separate concern):
    - `GET /account/market-definitions` — list all defined markets (dropdown source for "Add market" dialog)
    - `POST /account/market-definition` — create a new market definition
  - **Mail text + preview endpoints** (dedicated — not part of channel PATCH):
    - `GET /account/channel/{channelId}/mail/type/list` — all 15 mail types with text keys, defaults, and override status per language
    - `GET /account/channel/{channelId}/mail/type/{mailType}` — text keys for one mail type
    - `PATCH /account/channel/{channelId}/mail/type/{mailType}` — update text overrides
    - `POST /account/channel/{channelId}/mail/type/{mailType}/preview?language={lang}` — rendered HTML preview
  - Register in `app/utils/repos.ts` and `useGeinsRepository.ts`
  - **DEPENDENCY**: Requires backend M1 (Channel CRUD) for core channel + language endpoints

- [ ] **1.3 Channel list page** (`app/pages/store/channel/list.vue`)
  - Table columns from Figma: ID, Name (link), URL, Markets (tooltip), Status (status)
  - `+ New channel` button in page header, using new_entity lang key
  - Standard list page pattern: `useAsyncData` → `useColumns` → `useTable` → `TableView`
  - Error handling with `fetchError` ref pattern

- [ ] **1.4 Channel edit page scaffold** (`app/pages/store/channel/[id].vue`)
  - `useEntityEdit` with create/edit mode
  - Tab bar: Storefront settings, General, Markets, Payments, Mails
  - Sidebar summary: Active toggle, Display name, Languages count, Markets count, Payment method, Transaction mails status
  - Standard edit-mode data loading boilerplate
  - Zod form schema for channel fields

- [ ] **1.5 Navigation entry**
  - Add "Channels" to `app/lib/navigation.ts` under the Store section
  - i18n keys in `en.json` and `sv.json`

### Confirmed API details

- `url` is a field on Channel for both GET and PATCH (stored as `tblSite.strUrl`)
- `defaultLanguage` is derived from the 1st language in sort order of `tblSiteLanguage` (not a direct field — see backend plan Decision #13)
- **Languages, markets, payments, mail general/layout, storefront settings** are all managed via `PATCH /account/channel/{id}` (multipart/form-data). The channel GET response returns all sub-entities.
- All endpoints use the `/account/` prefix (e.g. `/account/channel/{id}`, not `/channel/{id}`)
- Channel activate/deactivate use dedicated PUT endpoints (not a PATCH field)
- **Activation safety (RESOLVED)**: Backend handles lockout and safety internally. No transitional states are exposed to the frontend. Frontend provides UX guardrails only: disable rapid toggling (debounce/cooldown on the toggle) and show an informational message (e.g. "Activating a channel triggers background processing. This may take a moment."). No confirmation dialog required by the backend.
- **No DELETE endpoint** — channel deletion is not supported (RESOLVED)
- **No COPY endpoint** — channel duplication is out of scope (RESOLVED)

---

## Milestone 2: Storefront Settings Tab (Highest Priority Feature)

> **DEPENDENCY**: Requires backend M2 (Storefront Settings — reprioritized from original M5). Frontend can build the schema renderer and UI against the default JSON schema without the API, but API integration requires the channel GET/PATCH to include storefront data.

**Goal**: Build a JSON schema-driven settings editor for storefront configuration. This is the most complex and highest-priority tab.

### Screens reference

- **Storefront settings - Base settings** (Figma node `115:12835`)
- **Storefront settings - Catalogue mode** (Figma node `191:5002`)
- **Storefront settings - Layout options** (Figma node `132:4185`)

### Architecture

> **Full specification**: [Storefront Settings — Schema & Data Spec](./storefront-settings-schema-spec.md)

The entire Storefront settings section is driven by a **JSON schema**. The schema's **top level defines tabs** — each top-level key becomes a sub-tab. This means the user has full control over what tabs and fields appear. By default, Geins provides a standard schema with "Base settings" and "Layout options" tabs. Users building custom storefronts can paste their own schema to get a completely different tab structure and field set.

**Schema approach**:

- Top-level schema keys = sub-tabs (e.g. `"baseSettings"`, `"layoutOptions"`, or any custom name)
- Each tab contains sections with fields
- Build a recursive Vue renderer that maps schema field types → form components
- Store the active schema per channel (later: fetched from the API)
- The `...` menu on the Storefront settings card contains a "Change JSON schema" action

### Tasks

- [ ] **2.1 Define the JSON schema specification**
  - Design the schema format:
    - **Top level**: Object where each key is a tab (`{ tabKey: { label, icon?, sections[] } }`)
    - **Section**: `{ title, description?, icon?, fields[] }` — rendered as a card or grouped area
    - **Field types**: `string`, `number`, `boolean` (toggle), `select` (dropdown), `color`, `file` (upload), `radio-cards` (card-style selector with icon + description)
    - **Nested groups**: A field of type `group` contains child fields (e.g. "Access Requirements" with sub-toggles)
    - **Validation rules**: `required`, `min`, `max`, `pattern`
    - **Conditional visibility**: `visibleWhen: { field, equals }` — show/hide fields based on other field values
  - Document the schema format in `/docs/storefront-settings-schema.md`

- [ ] **2.2 Create default Geins storefront schema**
  - Encode the Figma screens as a JSON schema with two tabs:
    - **Tab: "Base settings"**: Storefront mode (radio-cards: Commerce / Catalogue), Access Requirements group (toggles: Price visibility, Order placement, Stock status)
    - **Tab: "Layout options"**: Logotype (file upload), Corner style (radio-cards: Square / Round), Font settings (Headings select, Body text select), Theme colors (color pickers — future)
  - Store as a static JSON file: `app/assets/schemas/storefront-settings-default.json`

- [ ] **2.3 Schema renderer component** (`app/components/channel/StorefrontSchemaRenderer.vue`)
  - Recursive component that walks one tab's schema sections and renders fields:
    - `string` → `Input`
    - `number` → `Input type="number"`
    - `boolean` → `Switch` toggle
    - `select` → `Select` dropdown
    - `color` → Color input (hex input + swatch preview)
    - `file` → File upload input
    - `radio-cards` → Card-style radio selector (like Storefront mode)
    - `group` → Nested section with title/description/icon containing child fields
  - Props: `schema` (single tab's schema), `modelValue` (current settings object for that tab)
  - Emits: `update:modelValue` for two-way binding
  - Handles nested groups recursively

- [ ] **2.4 Schema tab container** (`app/components/channel/ChannelStorefrontSettings.vue`)
  - Reads the full schema, generates sub-tabs dynamically from top-level keys
  - Each sub-tab renders `StorefrontSchemaRenderer` with its section of the schema
  - Default schema produces "Base settings" + "Layout options" tabs; a custom schema could produce entirely different tabs
  - "Preview" button in the card header (next to `...` menu)

- [ ] **2.5 JSON schema editor panel**
  - Accessed from the `...` (three-dot) menu → "Change JSON schema"
  - Opens a side `Sheet` with:
    - Code editor textarea (monospace, scrollable) for pasting/editing JSON
    - JSON validation on input (show errors inline)
    - "Apply" button to update the schema and re-render all tabs
    - "Reset to default" button to restore the Geins default schema
  - Schema stored in the channel's settings (persisted via API)

- [ ] **2.6 Storefront preview**
  - "Preview" button in the Storefront settings card header
  - Opens `{storefront_url}?preview={token}` in a new browser tab
  - Token generation: TBD — likely a backend endpoint that issues a short-lived preview token

### Confirmed API details

- **Storefront schema and settings are part of the channel object** — returned by `GET /account/channel/{id}` and updated via `PATCH /account/channel/{id}` (multipart/form-data). No separate storefront endpoints.
- Backend treats both schema and settings as **opaque JSON** — it stores and returns them without interpreting schema semantics or validating field values. Only basic JSON validity is checked.
- File uploads for image fields (e.g. `logoUrl`) are inline on the channel PATCH via multipart/form-data — upload field names must match setting property names. Backend replaces the value with the resulting blob URL.
- Backend validates max file size only (no image processing).
- Data stored in Cosmos DB `Settings` container.
- **Data shape (RESOLVED)**: Backend accepts and returns **nested JSON** for storefront settings. **Frontend owns** the mapping between the schema's dot-notation keys (e.g. `"accessRequirements.priceVisibility"`) and the nested JSON structure (e.g. `{ "accessRequirements": { "priceVisibility": true } }`). The schema renderer handles this conversion in both directions.
- Auto-fallback: if no merchant-specific storefront doc exists, the GET response returns customer-agnostic defaults.

### Open questions

- What is the storefront preview URL pattern? Does the API provide it or is it derived from the channel URL?
- For the JSON schema, do we need to support array fields (e.g. multiple banner slots)?
- Should the schema editor have syntax highlighting? (Could use a lightweight lib like `vue-codemirror` later)

### Future considerations

- Schema versioning for backwards compatibility when the default schema evolves
- Possible schema marketplace or sharing between channels

---

## Milestone 3: General Tab

**Goal**: Implement the General tab with channel details and language management.

### Screens reference

- **Channel - edit - general** (Figma node `43:19846`)

### Tasks

- [ ] **3.1 Channel details card**
  - `ContentEditCard` with fields: Display name, Name (admin-only), URL
  - Helper text: "Generated by initial display name upon creation" for Name, "Changing the url will break existing links" for URL
  - `FormGrid design="1+1"` layout for Display name + Name, full-width for URL

- [ ] **3.2 Languages card — Default language section**
  - Display current default language with country flag icon
  - "Change" button in `#header-action` slot
  - On click: open a `Dialog` containing `FormInputCountrySelect`
  - **New**: Add `showFlags` prop to `FormInputCountrySelect` to toggle country flag icons
  - Fetch languages from existing `globalApi.language.list()` (already available in accountStore)

- [ ] **3.3 Languages card — Additional languages section**
  - Table (Minimal mode) showing: Language (with flag, create new custom cell type called 'country'), Status (badge), Edit action
  - "+ Add" button in section header
  - On click "Add": open a `Dialog` containing `FormInputTagsSearch` — this existing component (`app/components/form/input/FormInputTagsSearch.vue`) provides searchable multi-select with tags, built on reka-ui Combobox + TagsInput. It accepts `EntityBaseWithName[]` and returns `string[]` of IDs. `Language` is compatible (has `_id` + `name`). Pass `disableTeleport` since it's inside a Dialog. Filter out already-added languages from the `dataSet`.
  - **Enhancement needed for `FormInputTagsSearch`**: Currently renders plain text for both dropdown items and tag pills. Add a scoped slot (e.g. `#item="{ item }"`) for custom dropdown item rendering and a `#tag="{ item }"` slot for custom tag pill rendering, so we can prepend country flag icons next to language names. Fallback to current plain text behavior when slots aren't provided.
  - On click Edit (pencil icon): open a sheet/dialog to toggle active status for that language
  - Languages sourced from `globalApi.language.list()` (all system languages), filtered to exclude already-added ones

- [ ] **3.4 Sidebar summary panel**
  - `useEntityEditSummary` integration
  - Active status badge + toggle switch
  - Summary rows: Display name, Languages (count), Markets (count), Payment (method name), Transaction mails (Enabled/Disabled)
  - All values reactive from entity data

### Confirmed API details

- Languages are managed via `PATCH /account/channel/{id}` — the update payload includes the full languages array (add, remove, reorder, toggle active). No separate language sub-endpoints.
- Default language = 1st in sort order of channel languages (backend Decision #13)
- The "Add" dialog shows all system languages (from `globalApi.language.list()`), filtered to exclude already-added ones
- **DEPENDENCY**: Requires backend M1 (Channel CRUD & Language Management)

---

## Milestone 4: Markets Tab

**Goal**: Display and manage markets assigned to a channel.

### Screens reference

- **Channel - edit - markets** (Figma node `91:2365`)

### Tasks

- [ ] **4.1 Markets card — Default market section**
  - Single-row display: ID, Country (with flag), Currency, VAT, Status
  - "Change" button to switch default market (dialog to pick from existing channel markets)

- [ ] **4.2 Markets card — Additional markets table**
  - Minimal mode table columns: ID, Country (flag), Currency, VAT, Group, Active (switch), Remove (button)
  - **New component**: `TableCellSwitch` — inline toggle switch for table cells (reusable). Emits change event with row data
  - Remove button per row (with confirmation) to detach market from channel
  - "+ Add" button in section header

- [ ] **4.3 Add market dialog**
  - `Dialog` containing `FormInputTagsSearch` (same component as "Add language" — see task 3.3). Market data needs mapping to `EntityBaseWithName` shape (use country name as display). Pass `disableTeleport` for Dialog context.
  - Shows available markets not yet assigned to this channel
  - Select one or more markets → Add button
  - After adding, markets appear in the table with default active state

### Confirmed API details

- Market properties (currency, VAT, group) **cannot** be edited from the channel context — read-only display only. Editing happens on a dedicated market page.
- Market assignments (add, remove, toggle active, set default) are managed via `PATCH /account/channel/{id}` — the update payload includes the market assignments array. No separate channel-market sub-endpoints.
- **Market definition endpoints** (separate from channel — these are global, not per-channel):
  - `GET /account/market-definitions` — list all market definitions (source for "Add market" dialog)
  - `POST /account/market-definition` — create a new market definition
- **Market Definitions vs Market Assignments** — Backend introduces `tblMarket` as a template for markets that _can_ be assigned. Assigning a market to a channel creates a `tblSiteCountry` row. The "Add market" dialog should list market definitions, not raw countries.
- Market activation/deactivation publishes events (like channels). Backend handles safety internally; frontend provides UX guardrails only (same pattern as channel activation).
- **DEPENDENCY**: Requires backend M3 (Market Management) endpoints

---

## Milestone 5: Payments Tab

**Goal**: Display all available payment methods with enable/disable toggles per channel.

### Screens reference

- **Channel - edit - payments** ([Figma](https://www.figma.com/design/RlRU6LojxD3cGjaBMOVkk7/Self-service---Sales-channels?node-id=29-7163)) — simplified: no "Add payment" button, no configure (gear) button, only switches

### Confirmed API details

- Payment methods are included in the `GET /account/channel/{id}` response with their current active state per channel.
- **Payments are toggleable** (active `true`/`false`) via `PATCH /account/channel/{id}` — same mechanism as markets and languages. (RESOLVED — no longer read-only.)
- Data source: `tblPayment` + `tblPaymentRow` (active payments connected to channel)
- Response model: `ChannelPayment` with nested market/customer type info and `active` boolean
- **DEPENDENCY**: Requires backend M4 (Payment Assignment) endpoint

### Tasks

- [ ] **5.1 Payments card — All available payment methods**
  - `ContentEditCard` with title "Payments"
  - List of all available payment methods for this channel, each row showing:
    - Payment icon/logo (e.g. Manual Invoice icon, Geins Pay logo, SVEA text, PayPal logo)
    - Method name
    - Subtitle: "Markets: X | Customer types: X | Customer groups: X"
    - Enable/disable `Switch` toggle — toggles `active` on the payment, saved via channel PATCH
  - No "Add payment" button — all available methods are always shown
  - No configure (gear) button — just the switch for now

- [ ] **5.2 Payment method types**
  - Define `PaymentMethod` type (id, name, icon?, markets, customerTypes, customerGroups, active)
  - `ChannelResponse` includes `paymentMethods` array (part of the channel object)

### Future considerations

- Each payment method may get a settings sheet (gear button) for per-method configuration
- Payment method icons/logos may come from the API or need a local icon mapping

---

## Milestone 6: Mails Tab

**Goal**: Display and configure transaction mail templates per channel.

> **DEPENDENCY**: Requires backend M5 (Mail Configuration) for mail text + preview endpoints, and backend M1 for mail general/layout (which live on the channel object). Also requires two **new endpoints in the legacy mail service** (`carismar-mail` repo) for text key defaults — cross-team dependency.

### Screens reference

- **Mails - Mail content** (Figma node `99:21317`)
- **Mails - General settings** (Figma node `175:4240`)
- **Mails - Layout options** (Figma node `179:6151`)
- **Sheet - configure mail** (Figma node `184:6761`)
- **Sheet - preview mail** (Figma node `188:4756`)

### Confirmed API details

- **Mail general + layout settings live on the channel object** — returned by `GET /account/channel/{id}` and updated via `PATCH /account/channel/{id}` (multipart/form-data, including file uploads for LogoUri/HeaderImgUri). No separate mail settings endpoint.
- **Mail text override endpoints** (dedicated — not part of channel PATCH):
  - `GET /account/channel/{channelId}/mail/type/list` — all 15 mail types with text keys, defaults, and override status per language
  - `GET /account/channel/{channelId}/mail/type/{mailType}` — text keys for one mail type
  - `PATCH /account/channel/{channelId}/mail/type/{mailType}` — update text overrides (omitted = untouched, empty string = revert to default)
- **Mail preview** (dedicated):
  - `POST /account/channel/{channelId}/mail/type/{mailType}/preview?language={lang}` — proxy to legacy mail service, returns rendered HTML
  - Default preview (no real data) uses reference ID = 0, which generates dummy data
- **Data store**: Azure Table Storage (`MailSettings` entity — flat row per customer-environment)
- **Text overrides**: `MailSettings.Texts` JSON property — `Dict<textKey, Dict<langCode, override>>`. Keys strip `MAIL_V2_` prefix.
- **All 15 mail types are canonical** (RESOLVED — Figma shows 9, but the frontend renders dynamically from the backend response). Full list: OrderConfirmation, OrderProcessing, OrderDelivered, OrderCancelled, OrderRowRemoved, OrderRowReturned, CustomerWishlist, CustomerRefunded, CustomerRegistered, CustomerUnregistered, CustomerMessageNotification, CustomerPasswordReset, ProductTellAFriend, ProductSizeAvailable, ProductMonitorNotification
- **Master toggle**: `MailSettings.Disabled` is a global master toggle per customer-environment (already exists in legacy)

### Tasks

- [ ] **6.1 Mails card with sub-tabs**
  - `ContentEditCard` with inner tabs: Mail content, General, Layout options
  - Settings gear icon in card header (for global mail settings)

- [ ] **6.2 Mail content sub-tab**
  - List of mail templates rendered **dynamically from backend response** — not a hardcoded list
  - Each row showing: icon, template name, description, Edit (pencil) icon, override status per language
  - Uses `GET /account/channel/{channelId}/mail/type/list` (returns all 15 types)
  - Note: per-type enable/disable toggle may not be supported — backend has only a **global** `Disabled` toggle, not per-type.

- [ ] **6.3 Mail configuration sheet**
  - Sheet with Edit/Preview tabs
  - **Edit tab**: Language selector (flag dropdown), text fields for each text key returned by `GET /account/channel/{channelId}/mail/type/{mailType}`. Each field shows default value as placeholder, with override status indicator.
  - Template variable support (e.g. `{name}`, `{refund_amount}`, `{site_name}`)
  - "Restore to system default" button — sends empty string for overridden text keys to revert
  - Save via `PATCH /account/channel/{channelId}/mail/type/{mailType}`
  - Footer: Cancel + Update

- [ ] **6.4 Mail preview sheet tab**
  - Renders an HTML preview of the mail template
  - `POST /account/channel/{channelId}/mail/type/{mailType}/preview?language={lang}`
  - Preview renders with dummy data when no real entity ID is provided (reference ID = 0)

- [ ] **6.5 General settings sub-tab**
  - Required settings: Display name (`DisplayName`), From email address (`FromEmailAddress`), Login URL (`LoginUrl`), Password reset URL (`PasswordResetUrl`)
  - Optional settings: BCC email (`OrderConfirmationBCCEmail`), SMTP overrides (`SmtpHost`, `SmtpPort`, `SmtpUser`, `SmtpPassword`)
  - `FormGrid design="1+1+1"` for the 3-column row
  - Data sourced from `GET /account/channel/{id}`, saved via `PATCH /account/channel/{id}`

- [ ] **6.6 Layout options sub-tab**
  - Images section: Logo upload (`LogoUri`), Header image upload (`HeaderImgUri`) — via multipart/form-data on channel PATCH
  - Colors section: All color properties from `MailSettings` (BackgroundColor, BodyColor, HeaderColor, FooterColor, etc.) — 13 color fields total
  - Typography: FontLink, FontFamily, FontSizeSmall/Medium/Large, LineHeight
  - Shape: BorderRadius, ProdImgSize
  - Data sourced from `GET /account/channel/{id}`, saved via `PATCH /account/channel/{id}`

---

## Milestone 7: Polish & Integration

**Goal**: Final integration, cross-tab consistency, and UX polish.

### Tasks

- [ ] **7.1 i18n completion**
  - All labels, descriptions, placeholders, error messages in both `en.json` and `sv.json`
  - Entity action keys: `save_entity` with channel interpolation (no `delete_entity` — deletion not supported)

- [ ] **7.2 Unsaved changes across tabs**
  - Ensure `useEntityEdit` tracks changes across all tabs correctly
  - Tab switching should not lose data

- [ ] **7.3 Breadcrumbs & page titles**
  - Store > Channels > [Channel name]
  - `setCurrentTitle` integration for entity name in tab title

- [ ] **7.4 Form validation**
  - Zod schemas for all editable fields
  - Per-tab validation before save

~~**7.5 Delete channel**~~ — **REMOVED**: Channel deletion is not supported by the backend. No DELETE endpoint. (RESOLVED)

~~**7.6 Copy channel**~~ — **REMOVED**: Channel duplication is out of scope. No COPY endpoint. (RESOLVED)

---

## ~~Milestone 8: Product Search Tab~~ — DEFERRED

> **RESOLVED**: Product search configuration is explicitly out of backend scope. This milestone is deferred until a backend endpoint is available. No mock API work required. The Product search tab should be omitted from the channel edit page tab bar until this milestone is revived.

---

## Type Gaps (assumed fields not yet in types)

Based on the Figma designs and backend plan, the current `Channel` type is missing:

| Field                | Source           | Notes                                                                                  |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `url`                | General tab      | Confirmed: stored in `tblSite.strUrl`, available on GET and PATCH                      |
| `defaultLanguage`    | General tab      | Derived: 1st in sort order of `tblSiteLanguage` (backend Decision #13)                 |
| `languages`          | General tab      | Array on channel object — managed via channel PATCH                                    |
| `markets`            | Markets tab      | Array on channel object — assignments managed via channel PATCH                        |
| `paymentMethods`     | Payments tab     | Array on channel object — active toggles managed via channel PATCH                     |
| `mailSettings`       | Mails tab        | General + layout settings on channel object; text overrides via dedicated endpoints     |
| `storefrontSettings` | Storefront tab   | Opaque nested JSON on channel object — frontend owns schema↔UI mapping                 |
| `storefrontSchema`   | Storefront tab   | Opaque JSON on channel object — backend stores without interpretation                  |

**Key insight**: All sub-entities live on the channel object and are returned by `GET /account/channel/{id}`. The single `PATCH /account/channel/{id}` (multipart/form-data) is the write surface for everything except mail text overrides and mail preview, which have dedicated endpoints.

---

## Dependencies & Risks

| Risk                                         | Impact                               | Mitigation                                                                            |
| -------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| Channel CRUD API not ready (backend M1)      | Blocks FE M1, M3                     | Start with mock data / existing list endpoint; build UI first                         |
| Storefront data not on channel yet (BE M2)   | Blocks FE M2 API integration         | Schema renderer + default JSON can be built without API; connect when BE M2 is ready  |
| Market API not ready (backend M3)            | Blocks FE M4                         | Build UI shell with mock data                                                         |
| Payment API not ready (backend M4)           | Blocks FE M5                         | Build UI shell with mock data                                                         |
| Mail text/preview not ready (backend M5)     | Blocks FE M6 text editing + preview  | General/layout settings available via channel earlier; text editing waits for BE M5    |
| Legacy mail service changes (backend M5)     | Blocks FE M6 preview + text keys     | Cross-team dependency on `carismar-mail` repo — coordinate early                      |

---

## Resolved Issues

All previously open issues have been resolved. Decisions applied:

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Channel DELETE | **Not supported.** No DELETE endpoint. Frontend omits delete flows. |
| 2 | Channel COPY | **Out of scope.** No COPY endpoint. Frontend omits copy flows. |
| 3 | Payments read-only vs toggles | **Toggleable.** Payments have `active` flag, toggled via `PATCH /account/channel/{id}`. |
| 4 | Activation lockout | **Backend handles safety internally.** Frontend provides UX guardrails only (disable rapid toggling, informational message). No transitional states exposed. |
| 5 | Storefront data shape | **Backend accepts nested JSON, treats it as opaque.** Frontend owns schema↔UI mapping (dot-notation ↔ nested). |
| 6 | Product search | **Deferred.** Explicitly out of backend scope. Frontend M8 deferred. |
| 7 | Mail types (9 vs 15) | **All 15 backend types are canonical.** Frontend renders dynamically from backend response. |

---

## Cross-Plan Dependency Map

The backend team has reprioritized Storefront Settings from M5 → M2 to align with the frontend's highest-priority feature.

```
Backend (new order)          → Frontend dependency
─────────────────────────────────────────────────────
BE M0: Test Infra            → (no frontend dependency)
BE M1: Channel CRUD          → FE M1 (Foundation), FE M3 (General Tab)
BE M2: Storefront Settings   → FE M2 (Storefront Settings — highest FE priority) ✅ aligned
BE M3: Market Management     → FE M4 (Markets Tab)
BE M4: Payment Assignment    → FE M5 (Payments Tab)
BE M5: Mail Configuration    → FE M6 (Mails Tab — text overrides + preview)
BE M6: Events & Background   → (no direct FE dependency — safety is backend-internal)

Frontend                     → Backend dependency
─────────────────────────────────────────────────────
FE M1 (Foundation)           → BE M1
FE M2 (Storefront Settings)  → BE M2 (for API integration; UI can be built ahead)
FE M3 (General Tab)          → BE M1
FE M4 (Markets Tab)          → BE M3
FE M5 (Payments Tab)         → BE M4
FE M6 (Mails Tab)            → BE M1 (general/layout on channel) + BE M5 (text/preview endpoints) + legacy mail service
FE M7 (Polish)               → (no blockers — all APIs available by this point)
FE M8 (Product Search)       → DEFERRED — no backend support
```

---

## Linear Structure

```
Project: Channels
├── Milestone 1: Foundation (Types, Repository, CRUD)    ← needs BE M1
├── Milestone 2: Storefront Settings (highest priority)  ← needs BE M2 ✅
├── Milestone 3: General Tab                             ← needs BE M1
├── Milestone 4: Markets Tab                             ← needs BE M3
├── Milestone 5: Payments Tab                            ← needs BE M4
├── Milestone 6: Mails Tab                               ← needs BE M1 + BE M5 + legacy mail
├── Milestone 7: Polish & Integration                    ← no blockers
└── Milestone 8: Product Search Tab                      ← DEFERRED
```

> **Build order**: M1 → M2 → M3 → M4 → M5 → M6 → M7 (milestones are numbered by priority)
>
> **Recommended parallel work strategy**: Frontend can build UI shells (components, local state, mock data) ahead of backend API availability. API integration passes happen as backend milestones complete. The schema renderer (M2) and mail UI shell (M6) are the best candidates for early frontend-only work.

Each milestone's tasks become individual Linear issues. Milestones map to Linear milestones (or cycles) within the project.
