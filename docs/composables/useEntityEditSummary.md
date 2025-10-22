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
}>;
```

A computed property that unwraps all reactive inputs and returns a plain object with the current values. This is perfect for passing to components that expect non-reactive props.

## Type Definitions

```ts
function useEntityEditSummary(
  createMode: Ref<boolean> | ComputedRef<boolean>,
  formTouched: Ref<boolean> | ComputedRef<boolean>,
  summary: Ref<DataItem[]> | ComputedRef<DataItem[]>,
  settingsSummary: Ref<DataItem[]> | ComputedRef<DataItem[]>,
  entityName: string,
  entityLiveStatus: Ref<boolean> | ComputedRef<boolean>,
): UseEntityEditSummaryReturnType;

interface UseEntityEditSummaryReturnType {
  summaryProps: ComputedRef<{
    createMode: boolean;
    formTouched: boolean;
    summary: DataItem[];
    settingsSummary: DataItem[];
    entityName: string;
    entityLiveStatus: boolean;
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
