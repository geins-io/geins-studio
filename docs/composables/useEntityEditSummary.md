# `useEntityEditSummary`

The `useEntityEditSummary` composable is used to create a `computed` object that summarizes the state of an entity being edited. It provides a convenient way to pass multiple reactive properties to summary display components.

## Usage

### Basic Usage

```ts
const { entityName, createMode, formTouched } = useEntityEdit( ... );

const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  if (!createMode.value) {
    dataList.push({
      label: t('entity_id', { entityName }),
      value: String(entityDataUpdate.value?._id),
      displayType: DataItemDisplayType.Copy,
    });
  }
  if (entityData.value?.name) {
    dataList.push({
      label: t('entity_name', { entityName }),
      value: entityData.value.name,
    });
  }
  return dataList;
});

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  entityName,
  entityLiveStatus,
  showActiveStatus: false,
  status: 'pending',
});

```

```vue
<template>
  <ContentEditSummary
    v-model:active="entityDataUpdate.active"
    v-bind="summaryProps"
  />
</template>
```

## Parameters

#### `createMode`

```ts
createMode: Ref<boolean> | ComputedRef<boolean>;
```

Indicates whether the form is in create mode (editing a new entity) or edit mode (editing an existing entity).

#### `formTouched`

```ts
formTouched: Ref<boolean> | ComputedRef<boolean>;
```

Indicates whether the form has been touched/modified by the user.

#### `summary`

```ts
summary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
```

Array of data items for the main summary section. Each `DataItem` contains:

- `label`: Display label for the item
- `value`: Display value for the item

#### `settingsSummary`

```ts
settingsSummary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
```

Array of data items for the settings/configuration summary section.

#### `entityName`

```ts
entityName: string;
```

Name of the entity being edited (e.g., 'product', 'user', 'order').

#### `entityLiveStatus`

```ts
entityLiveStatus: Ref<boolean> | ComputedRef<boolean>;
```

Indicates the live/active status of the entity.

#### `showActiveStatus`

```ts
showActiveStatus?: boolean;
```

Controls whether the active/inactive badge and toggle are displayed. Defaults to `true` if omitted.

#### `status`

```ts
status?: string;
```

Optional explicit status string (e.g., `'draft'`, `'pending'`, `'accepted'`). When provided, overrides the default active/inactive badge with a `StatusBadge` supporting all status variants.

## Properties and Methods

### `summaryProps`

```ts
summaryProps: ComputedRef<{
  createMode: boolean;
  formTouched: boolean;
  summary: DataItem[];
  settingsSummary: DataItem[];
  entityName: string;
  entityLiveStatus: boolean;
  showActiveStatus?: boolean;
  status?: string;
}>;
```

A computed property that unwraps all reactive inputs and returns a plain object with the current values. This is perfect for passing to components that expect non-reactive props. The `showActiveStatus` and `status` fields are only included when explicitly set, so they don't override the component defaults when omitted.

## Type Definitions

```ts
function useEntityEditSummary(props: {
  createMode: Ref<boolean> | ComputedRef<boolean>;
  formTouched: Ref<boolean> | ComputedRef<boolean>;
  summary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
  settingsSummary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
  entityName: string;
  entityLiveStatus: Ref<boolean> | ComputedRef<boolean>;
  showActiveStatus?: boolean;
  status?: string;
}): UseEntityEditSummaryReturnType;

interface UseEntityEditSummaryReturnType {
  summaryProps: ComputedRef<{
    createMode: boolean;
    formTouched: boolean;
    summary: DataItem[];
    settingsSummary: DataItem[];
    entityName: string;
    entityLiveStatus: boolean;
    showActiveStatus?: boolean;
    status?: string;
  }>;
}

enum DataItemDisplayType {
  String = 'string',
  Array = 'array',
  Copy = 'copy',
}

interface DataItem {
  label: string;
  value:
    | string
    | number
    | boolean
    | Array<string>
    | Array<number>
    | Array<Record<string, unknown>>
    | Record<string, unknown>;
  displayValue?: string;
  displayType?: DataItemDisplayType;
  entityName?: string;
}
```
