# Channels — Project Plan

> **Figma**: [Self-service - Channels - UX handoff](https://www.figma.com/design/Ayaap7VbZKzPt4kjf2sFAp/Self-service---Channels---UX-handoff?node-id=0-1&p=f)
> **Date**: 2026-03-16
> **Status**: Draft — iterating before Linear import
>
> **Related docs**:
> - [Channels — Concept Documentation](./channels-concept.md) — domain model, relationships, and data flow
> - [Storefront Settings — Schema & Data Spec](./storefront-settings-schema-spec.md) — full schema types, default schema, renderer behavior

---

## Overview

Build the Channel entity management pages in Geins Studio. Channels represent sales channels (webshops, physical stores) and contain markets, languages, payment methods, mail templates, product search config, and storefront settings.

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
6. **Product search** (lowest priority)

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
  - Add `PaymentMethod`, `MailTemplate`, `SearchConfig`, `StorefrontSettings` types as they become known from the API

- [ ] **1.2 Create channel API repository** (`app/utils/repositories/channel.ts`)
  - Use `entityRepo` factory chain (base → list → get → full CRUD)
  - Endpoints (assumed, confirm with API):
    - `GET /channel/list` — list all
    - `GET /channel/{id}` — single channel with full details
    - `POST /channel` — create
    - `PATCH /channel/{id}` — update
    - `DELETE /channel/{id}` — delete
  - Register in `app/utils/repos.ts` and `useGeinsRepository.ts`

- [ ] **1.3 Channel list page** (`app/pages/store/channel/list.vue`)
  - Table columns from Figma: ID, Name (link), URL, Markets (tooltip), Status (status)
  - `+ New channel` button in page header, using new_entity lang key
  - Standard list page pattern: `useAsyncData` → `useColumns` → `useTable` → `TableView`
  - Error handling with `fetchError` ref pattern

- [ ] **1.4 Channel edit page scaffold** (`app/pages/store/channel/[id].vue`)
  - `useEntityEdit` with create/edit mode
  - Tab bar: General, Markets, Payments, Mails, Storefront settings
  - Sidebar summary: Active toggle, Display name, Languages count, Markets count, Payment method, Transaction mails status
  - Standard edit-mode data loading boilerplate
  - Zod form schema for channel fields

- [ ] **1.5 Navigation entry**
  - Add "Channels" to `app/lib/navigation.ts` under the Store section
  - i18n keys in `en.json` and `sv.json`

### Confirmed API details

- `url` is a field on Channel for both GET and PATCH
- `defaultLanguage` is a field on Channel for both GET and PATCH
- Languages are updated as part of the channel PATCH (no separate endpoint)

### Open questions

- Confirm channel API endpoint structure (especially if it differs from `/account/channel/`)

---

## Milestone 2: Storefront Settings Tab (Highest Priority Feature)

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

### Open questions

- What is the storefront preview URL pattern? Does the API provide it or is it derived from the channel URL?
- For the JSON schema, do we need to support array fields (e.g. multiple banner slots)?
- Should the schema editor have syntax highlighting? (Could use a lightweight lib like `vue-codemirror` later)
- Does the API already have a settings endpoint, or will the schema/settings be stored as part of the channel object?

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

- Languages are updated as part of the channel PATCH payload (no separate endpoint)
- The "Add" dialog shows all system languages (from `globalApi.language.list()`), filtered to exclude already-added ones

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

### Open questions

- Is adding/removing a market from a channel its own endpoint, or part of the channel PATCH payload?

---

## Milestone 5: Payments Tab

**Goal**: Display all available payment methods with enable/disable toggles per channel.

### Screens reference

- **Channel - edit - payments** ([Figma](https://www.figma.com/design/RlRU6LojxD3cGjaBMOVkk7/Self-service---Sales-channels?node-id=29-7163)) — simplified: no "Add payment" button, no configure (gear) button, only switches

### Tasks

- [ ] **5.1 Payments card — All available payment methods**
  - `ContentEditCard` with title "Payments"
  - List of all available payment methods (not just configured ones), each row showing:
    - Payment icon/logo (e.g. Manual Invoice icon, Geins Pay logo, SVEA text, PayPal logo)
    - Method name
    - Subtitle: "Markets: X | Customer types: X | Customer groups: X"
    - Enable/disable `Switch` toggle
  - No "Add payment" button — all available methods are always shown
  - No configure (gear) button — just the switch for now
  - Toggling a switch enables/disables that payment method for this channel

- [ ] **5.2 Payment method types**
  - Define `PaymentMethod` type (id, name, icon?, markets, customerTypes, customerGroups, enabled)
  - Extend `ChannelResponse` to include `paymentMethods`
  - Determine if enabling/disabling is part of the channel PATCH or a separate endpoint

### Future considerations

- Each payment method may get a settings sheet (gear button) for per-method configuration
- Payment method icons/logos may come from the API or need a local icon mapping

---

## Milestone 6: Mails Tab

**Goal**: Display and configure transaction mail templates per channel.

### Screens reference

- **Mails - Mail content** (Figma node `99:21317`)
- **Mails - General settings** (Figma node `175:4240`)
- **Mails - Layout options** (Figma node `179:6151`)
- **Sheet - configure mail** (Figma node `184:6761`)
- **Sheet - preview mail** (Figma node `188:4756`)

### Tasks

- [ ] **6.1 Mails card with sub-tabs**
  - `ContentEditCard` with inner tabs: Mail content, General, Layout options
  - Settings gear icon in card header (for global mail settings)

- [ ] **6.2 Mail content sub-tab**
  - List of mail templates, each showing: icon, template name (e.g. "CustomerRefunded"), description, Edit (pencil) icon, Enabled/Disabled toggle
  - Mail types from Figma: CustomerRefunded, CustomerRegistered, CustomerUnregistered, CustomerPasswordReset, OrderConfirmation, OrderDelivered, OrderCancelled, OrderRowRemoved, OrderRowReturned
  - Single API endpoint with template type as parameter

- [ ] **6.3 Mail configuration sheet**
  - Sheet with Edit/Preview tabs
  - **Edit tab**: Language selector (flag dropdown), fields: Inbox preview, Mail title, Mail subtitle, Mail footer — all text inputs with template variable support (e.g. `{name}`, `{refund_amount}`, `{site_name}`)
  - "Restore to system default" button
  - "Email enabled" toggle at bottom
  - Footer: Cancel + Update

- [ ] **6.4 Mail preview sheet tab**
  - Renders an HTML preview of the mail template
  - Fetched from a dedicated API endpoint that returns rendered HTML

- [ ] **6.5 General settings sub-tab**
  - Required settings: Display name, From email address, Login URL, Password reset URL
  - Optional settings: BCC email for order confirmation emails
  - `FormGrid design="1+1+1"` for the 3-column row

- [ ] **6.6 Layout options sub-tab**
  - Images section: Logo upload ("Use Theme logo" option), Header image upload
  - Colors section: Background color, Body color, Header background (hex inputs + color swatches) + "Apply theme colors" button
  - Font settings: Headings + Body text dropdowns + "Apply theme fonts" button

### Confirmed API details

- Single endpoint for all mail templates, with template type as a parameter
- Mail preview is a dedicated endpoint that returns rendered HTML
- Layout options are shared across all mails (not per-mail)

---

## Milestone 7: Polish & Integration

**Goal**: Final integration, cross-tab consistency, and UX polish.

### Tasks

- [ ] **7.1 i18n completion**
  - All labels, descriptions, placeholders, error messages in both `en.json` and `sv.json`
  - Entity action keys: `save_entity`, `delete_entity` with channel interpolation

- [ ] **7.2 Unsaved changes across tabs**
  - Ensure `useEntityEdit` tracks changes across all tabs correctly
  - Tab switching should not lose data

- [ ] **7.3 Breadcrumbs & page titles**
  - Store > Channels > [Channel name]
  - `setCurrentTitle` integration for entity name in tab title

- [ ] **7.4 Delete channel**
  - Confirmation dialog
  - Only available for non-active channels (or with explicit warning)

- [ ] **7.5 Copy channel**
  - If API supports it, add copy action to list page table actions
  - Similar pattern to quotation copy

- [ ] **7.6 Form validation**
  - Zod schemas for all editable fields
  - Per-tab validation before save

---

## Milestone 8: Product Search Tab

**Goal**: Configure search field weighting and indexing per channel.

### Screens reference

- **Channel - edit - search** (Figma node `110:3779`)

### Tasks

- [ ] **8.1 Search configuration card**
  - Table-like layout with columns: Field, Weighting (number input), Enabled (toggle)
  - Built-in fields: ArticleNumber, Product id, Name, Category name, Category description, Brand, SKU Article number, Text 1-3
  - "Restore to default weighting" button in card header
  - Each row is editable inline (number input + toggle)

- [ ] **8.2 Custom search field configuration**
  - Section below the main table
  - "+ Add field" button to add up to 6 custom search fields
  - Each custom field: name input, weighting input, enabled toggle, remove action

- [ ] **8.3 Search config types**
  - Define `SearchFieldConfig` (field, weighting, enabled)
  - Define `SearchConfig` (fields array + custom fields array)
  - Likely its own endpoint per channel

### Open questions

- Is this its own endpoint (e.g. `GET/PATCH /channel/{id}/search`) or part of the channel object?
- What are the valid weighting ranges?

---

## Type Gaps (assumed fields not yet in types)

Based on the Figma designs, the current `Channel` type is missing:

| Field                | Figma Source   | Notes                                          |
| -------------------- | -------------- | ---------------------------------------------- |
| `url`                | General tab    | Confirmed: available on GET and PATCH           |
| `defaultLanguage`    | General tab    | Confirmed: available on GET and PATCH           |
| `paymentMethods`     | Payments tab   | Array of configured payment methods         |
| `mailSettings`       | Mails tab      | Mail configuration (general + per-template) |
| `searchConfig`       | Search tab     | Search field weighting + custom fields      |
| `storefrontSettings` | Storefront tab | JSON blob driven by schema                  |
| `storefrontSchema`   | Storefront tab | Custom JSON schema (if overridden)          |

These will be defined as the API endpoints become available. Start with assumed shapes and refine once the API is confirmed.

---

## Dependencies & Risks

| Risk                                | Impact                               | Mitigation                                                    |
| ----------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| Channel CRUD API not ready          | Blocks all milestones                | Start with mock data / existing list endpoint; build UI first |
| Storefront schema design complexity | Could delay highest-priority feature | Define minimal schema spec first, iterate                     |
| Mail endpoints unknown              | Blocks Milestone 6                   | Build UI shell, connect when endpoints are confirmed          |
| Search endpoint unknown             | Blocks Milestone 8                   | Same approach — UI first                                      |

---

## Linear Structure

```
Project: Channels
├── Milestone 1: Foundation (Types, Repository, CRUD)
├── Milestone 2: Storefront Settings (highest priority)
├── Milestone 3: General Tab
├── Milestone 4: Markets Tab
├── Milestone 5: Payments Tab
├── Milestone 6: Mails Tab
├── Milestone 7: Polish & Integration
└── Milestone 8: Product Search Tab (lowest priority)
```

> **Build order**: M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 (milestones are numbered by priority)

Each milestone's tasks become individual Linear issues. Milestones map to Linear milestones (or cycles) within the project.
