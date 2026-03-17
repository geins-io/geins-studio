---
title: "Scaffold channel edit page with create/edit mode"
project: "Self Service (Channels)"
milestone: "M1 — Foundation"
priority: 2
estimate: 5
labels:
  - feature
  - confidence-medium
  - risk-medium
  - geins-studio
depends_on:
  - "./002-channel-repository.md"
  - "./003-navigation-and-i18n.md"
model: opus
mode: claude-code interactive
---

## Context

The channel edit page is the central hub for all channel configuration. It handles both create and edit mode, manages a tabbed interface (General, Markets, Payments, Mails, Storefront Settings), and includes a sidebar summary panel. This is the most complex piece of M1 — it must correctly implement the `useEntityEdit` lifecycle, Zod validation, the edit-mode data loading boilerplate, and set up the tab structure that later milestones will fill in.

## Expected Outcome

A working `[id].vue` page at `/store/channel/[id]` that:
- Creates new channels (route param `new`)
- Loads and edits existing channels (route param = ID)
- Shows a tab bar with placeholder content for tabs that will be built in later milestones
- Displays a sidebar summary panel with channel status and key info
- Tracks unsaved changes and shows save/delete actions

## Implementation Notes

**File: `app/pages/store/channel/[id].vue`**

Follow the entity edit page pattern from CLAUDE.md and reference `app/pages/orders/quotation/[id].vue`.

**1. Zod form schema:**
```typescript
const formSchema = toTypedSchema(z.object({
  details: z.object({
    displayName: z.string().min(1, t('entity_required', { entityName: 'display name' })),
    name: z.string().optional(),  // auto-generated, optional on create
    url: z.string().optional(),
    type: z.enum(['webshop', 'physical', 'other']).default('webshop'),
    active: z.boolean().default(true),
    defaultLanguage: z.string().optional(),
  }),
}));
```

**2. `useEntityEdit` setup:**
- Generic types: `<ChannelBase, ChannelResponse, ChannelCreate, ChannelUpdate>`
- `reshapeEntityData`: map response → update shape (only PATCH-accepted fields)
- `parseEntityData`: populate any display-only refs (languages, markets, etc.)
- `prepareCreateData`: map form → POST body
- `prepareUpdateData`: map form → PATCH body (only API-accepted fields — NOT response-only fields)
- `onFormValuesChange`: sync all update-relevant form fields to `entityDataUpdate`

**3. Edit-mode data loading boilerplate** (required — from CLAUDE.md):
```typescript
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<ChannelResponse>(
    entityFetchKey.value,
    () => channelApi.get(entityId.value, { fields: ['all'] }),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<ChannelResponse>(error.value, data.value);
    await parseAndSaveData(entity);
  });
}
```

**4. Tab bar:**
- `ContentEditTabs` with tabs: `['General', 'Markets', 'Payments', 'Mails', 'Storefront settings']`
- Tab priority from plan: Storefront settings (highest) → General → Markets → Payments → Mails → Product search (lowest)
- Only the General tab needs basic form fields in this issue — other tabs render placeholder content (e.g. "Coming soon" or empty `ContentEditCard`)

**5. General tab (basic fields only):**
- `ContentEditCard` with title "Channel details"
- `FormGrid design="1+1"` for Display name + Name (disabled in edit mode)
- Full-width URL field with helper text warning
- Type selector (webshop/physical/other)

**6. Sidebar summary:**
- `useEntityEditSummary` integration
- Active status badge + toggle
- Summary rows: Display name, Languages (count — "0" initially), Markets (count — "0" initially), Payment methods (count — "0" initially)
- All values reactive from entity data

**7. Page title / breadcrumbs:**
- `setCurrentTitle` for entity name in breadcrumbs
- Breadcrumb trail: Store > Channels > [Channel name] (or "New channel")

**Reference files:**
- Edit page pattern: `app/pages/orders/quotation/[id].vue`, `app/pages/pricing/price-list/[id].vue`
- Entity edit composable: `app/composables/useEntityEdit.ts`
- Summary: `app/composables/useEntityEditSummary.ts`
- Tabs: `app/components/content/edit/ContentEditTabs.vue`

## Acceptance Criteria

- Page renders at `/store/channel/new` (create mode) and `/store/channel/{id}` (edit mode)
- Create mode: form fields are empty, save creates a new channel via `channelApi.create()`
- Edit mode: form fields are populated from API response via the required data loading boilerplate
- After creation, auto-navigates to the edit URL (handled by `useEntityEdit`)
- Tab bar shows all 5 tabs; General tab has working form fields; other tabs show placeholder content
- Sidebar summary displays active status, display name, and count placeholders
- Unsaved changes detection works (save button disabled when no changes)
- Delete action works with confirmation dialog
- `setCurrentTitle` sets breadcrumb and page title correctly
- Zod validation prevents saving with empty display name
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- Unit test: verify `reshapeEntityData` correctly maps response to update shape
- Unit test: verify `prepareCreateData` and `prepareUpdateData` produce correct payloads

## Agent Execution
- **Model**: opus
- **Mode**: claude-code interactive
- **Why**: This is the most complex issue in M1 — it spans multiple composables, requires correct lifecycle management (useEntityEdit, useAsyncData, onMounted), and sets the architectural foundation for all subsequent milestones. Human review ensures the patterns are right before building on top.
