---
name: geins-list-page
description: "Guides correct implementation of entity list pages (list.vue) in the Geins Studio codebase. Use this skill whenever building a new list page, adding columns to an existing list, working with Tooltip columns, or debugging list page data flow. Trigger on: list page, list.vue, entity list, EntityList type, mapToListData, createTooltip, Tooltip column, useAsyncData list, TableView list, fetchError, list page pattern."
---

# Geins Studio — Entity List Page

List pages render a paginated, sortable table of entities at `pages/{domain}/{entity}/list.vue`. They follow a strict two-type pattern: the **API response type** and the **table display type**.

## Reference implementations

- **With Tooltip columns**: `app/pages/customers/company/list.vue` (best reference for new list pages)
- **With data mapping**: `app/pages/orders/quotation/list.vue`
- **Simple (no mapping)**: `app/pages/pricing/price-list/list.vue`

## The two-type pattern

Every list page defines two type aliases at the top:

```ts
type Entity = ChannelListItem;    // API response shape
type EntityList = ChannelList;     // Table display shape
```

The **Entity** type is what the API returns. The **EntityList** type is what the table renders — it may override array/object fields with `string`, `Tooltip`, or other display-friendly types.

### Defining the EntityList type

Follow the `CustomerCompanyList` pattern in `shared/types/Customer.ts`:

```ts
// In shared/types/Channel.ts
export interface ChannelList
  extends Omit<ChannelListItem, 'markets' | 'languages'> {
  markets: Tooltip;
  languages: Tooltip;
}
```

Use `Omit<Entity, ...fields>` to replace fields that need display transformation. Import `Tooltip` from `shared/types/Global.ts`.

## Page structure

```vue
<script setup lang="ts">
import type { Entity, EntityList, ColumnOptions, StringKeyOf } from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

type Entity = ApiResponseType;
type EntityList = TableDisplayType;

const scope = 'pages/{domain}/{entity}/list.vue';
const { t } = useI18n();
const { getEntityUrlFor } = useEntityUrl();

definePageMeta({ pageType: 'list' });

// 1. GLOBAL SETUP
const { domainApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityName = '{entity}';
const entityIdentifier = '{id}';
const entityUrl = getEntityUrlFor('{entity}', '{domain}', entityIdentifier);
const newEntityUrl = '/{domain}/{entity}/new';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({ entityName, entityList: true, scope });
const fetchError = ref(false);

// 2. MAP DATA (transform API → display)
const mapToListData = (list: Entity[]): EntityList[] => {
  return list.map((item) => {
    const { arrayField: rawArray, ...rest } = item;
    return {
      ...rest,
      arrayField: createTooltip({
        items: rawArray,
        entityName: 'sub_entity',
        formatter: (x) => x.name,
        t,
      }),
    };
  });
};

// 3. FETCH DATA
const { data, error, refresh } = await useAsyncData<Entity[]>(
  '{domain}-{entity}-list',
  () => domainApi.entity.list(),
);

// 4. COLUMNS
const { getColumns, addActionsColumn } = useColumns<EntityList>();

onMounted(() => {
  watch([data, error], ([newData, newError]) => {
    if (newError) { fetchError.value = true; dataList.value = []; return; }
    fetchError.value = false;
    if (newData) { dataList.value = mapToListData(newData); }
  }, { immediate: true });

  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: { name: 'link', arrayField: 'tooltip', active: 'status' },
    linkColumns: { name: { url: entityUrl, idField: '_id' } },
    columnTitles: { active: t('status') },
    excludeColumns: ['fieldsToHide'],
  };

  columns.value = getColumns(dataList.value, columnOptions);
  addActionsColumn(columns.value,
    { onEdit: (item: EntityList) => navigateTo(entityUrl.replace(entityIdentifier, String(item._id))) },
    'actions', ['edit'],  // available actions
  );
  loading.value = false;
});

// 5. VISIBILITY
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['_id'];
visibilityState.value = getVisibilityState(hiddenColumns);
</script>
```

## Template

```vue
<template>
  <ContentHeader :title="$t('navigation.{entities}')">
    <ContentActionBar>
      <ButtonIcon icon="new" :href="newEntityUrl">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>
  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
      :error="fetchError"
      :on-retry="refresh"
    >
      <template #empty-actions>
        <ButtonIcon icon="new" variant="secondary" @click="navigateTo(newEntityUrl)">
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
```

## Tooltip columns with `createTooltip()`

Use `createTooltip()` from `app/utils/tooltip.ts` to transform arrays into display-friendly tooltips:

```ts
import { createTooltip } from '@/utils/tooltip';  // auto-imported

const markets = createTooltip({
  items: channel.markets,        // the array to summarize
  entityName: 'market',          // i18n key for "N markets" / "No markets"
  formatter: (m) => m.country.name,  // how to render each item in tooltip
  t,                             // translation function
});
// Result: { displayValue: "2 markets", contentValue: "Sweden, Norway", disabled: false }
```

The `Tooltip` type (`shared/types/Global.ts`):
```ts
interface Tooltip {
  displayValue: string;   // shown in the cell
  contentValue: string;   // shown on hover
  disabled?: boolean;     // true when empty (no hover)
}
```

Set `columnTypes: { fieldName: 'tooltip' }` in column options to render `TableCellTooltip`.

## Column types reference

| Type | Cell component | Use for |
|------|---------------|---------|
| `'link'` | `NuxtLink` | Name/title columns that navigate to detail page |
| `'tooltip'` | `TableCellTooltip` | Arrays summarized as count + hover list |
| `'status'` | `TableCellStatus` → `StatusBadge` | Status strings or boolean active/inactive |
| `'currency'` | `TableCellCurrency` | Price/amount fields |
| `'channels'` | `TableCellChannels` | Channel name display |
| `'tags'` | `TableCellTags` | Tag arrays |
| `'boolean'` | `TableCellBoolean` | True/false display |

## Actions column

```ts
addActionsColumn(columns, props, type, availableActions);
```

- `type`: `'actions'` (dropdown menu), `'delete'` (single button), `'edit'` (single button)
- `availableActions`: subset of `['edit', 'copy', 'delete']`
- For edit-only: `addActionsColumn(columns, { onEdit: ... }, 'actions', ['edit'])`
- For full CRUD: pass `onEdit`, `onCopy`, `onDelete` handlers
- `disabledActions`: static array or `(item) => string[]` callback for per-row logic

## Error handling pattern

Always use the `fetchError` ref — never let API errors crash the page:

```ts
const fetchError = ref(false);
// Inside onMounted watch:
if (newError) { fetchError.value = true; dataList.value = []; return; }
fetchError.value = false;
```

Pass `:error="fetchError"` and `:on-retry="refresh"` to `TableView`. This shows an inline error state with a retry button instead of a fatal error page.

Wrap `TableView` in `<NuxtErrorBoundary>` as a runtime safety net for unexpected rendering errors.

## Checklist for new list pages

- [ ] Define `EntityList` type in `shared/types/` with Tooltip overrides for array fields
- [ ] Export from `shared/types/index.ts`
- [ ] `definePageMeta({ pageType: 'list' })`
- [ ] `mapToListData` with `createTooltip()` for array → Tooltip transformation
- [ ] `columnTypes` set for link, tooltip, status columns
- [ ] `excludeColumns` for fields not shown in table
- [ ] `hiddenColumns` for fields hidden by default (toggleable)
- [ ] Actions column with appropriate `availableActions`
- [ ] `NuxtErrorBoundary` + `fetchError` pattern
- [ ] `pnpm typecheck && pnpm lint:check && pnpm test --run` pass
- [ ] At least one Vitest render test
