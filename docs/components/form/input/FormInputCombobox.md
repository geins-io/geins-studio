# `FormInputCombobox`

`FormInputCombobox` is a text box that suggests values from a dataset and also takes text that isn't in it. The value is plain text, never a chip. Use it when a field is either one of a known set (e.g. a company's sales reps) or a free-text name. Generic over any item that extends `EntityBaseWithName`.

For a value that must come from the list, use [`FormInputSelectSearch`](/components/form/input/FormInputSelectSearch). For several values, use [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch).

## Features

- Plain-text model bound via `defineModel<string | null>()`; typed text stays when you leave the field
- Focusing, clicking, the arrow keys or the chevron open the list with **every** suggestion; it filters (case- and accent-insensitive, via reka-ui `useFilter`) only while you type
- Optional heading above the suggestions
- Check mark on the suggestion whose name matches the text exactly (trimmed, case-insensitive)
- An `Add {entity}: {text}` row at the bottom whenever the trimmed text matches no suggestion exactly — styled like `FormInputTagsSearch`'s add-new row. A prefix of a suggestion still gets the row
- Enter commits what you typed: while typing, the highlighted row is the exact match or the add row, never the first suggestion. Arrow keys still move to any suggestion
- Picking a suggestion fills the field and emits `select`; Escape, Tab or the add row close the list and keep the text
- Portaled dropdown with `disableTeleport` escape hatch
- Works inside `<FormField v-slot="{ componentField }">`; `id`/`aria-*`/`name`/`onBlur` land on the input

## Usage

### In a form

```vue
<template>
  <FormField v-slot="{ componentField }" name="ownerName">
    <FormItem>
      <FormLabel>{{ $t('owner') }}</FormLabel>
      <FormControl>
        <FormInputCombobox
          v-bind="componentField"
          :data-set="salesReps"
          entity-key="sales_rep"
          :heading="$t('sales_rep', 2)"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
```

### Telling a suggestion from free text

The model only holds text, so resolve it with `findEntityByName` (auto-imported from `app/utils`). It returns the item whose `name` matches exactly (trimmed, case-insensitive), or `undefined` for free text. This also covers text typed in full rather than picked. With duplicate names the first item wins.

```ts
const rep = findEntityByName(values.ownerName, salesReps.value);
const payload = rep
  ? { ownerId: rep._id }
  : { ownerName: values.ownerName.trim() };
```

`@select` fires with the item when a suggestion row is picked, for when you need to react right away.

## Props

### `dataSet`

```ts
dataSet?: T[]   // T extends EntityBaseWithName
```

The suggestions. Each row shows, filters and matches on `name` (`displayName` is ignored, so the text in the field always resolves back to the item).

- **Default:** `[]`

### `entityKey`

```ts
entityKey: string;
```

Raw i18n key of the entity (e.g. `'sales_rep'`), never a translated string. Drives the add row (`add_entity`), the empty state (`add_entity_by_typing`) and the chevron's label (`show_entity`).

### `heading`

```ts
heading?: string
```

Label above the suggestions (e.g. "Existing sales reps"). Hidden when no suggestion is listed.

### `placeholder`

```ts
placeholder?: string
```

Input placeholder.

- **Default:** `''`

### `disabled`

```ts
disabled?: boolean
```

Disables the input and the chevron.

- **Default:** `false`

### `disableTeleport`

```ts
disableTeleport?: boolean
```

Render the dropdown inline instead of portaled to `body`.

- **Default:** `false`

## v-model

### default

```ts
v-model: string | null
```

The text in the field — a suggestion's `name` or free text. `null` (e.g. a form seeded from the API) shows as an empty field; the component only ever emits strings.

## Events

### `select`

```ts
(e: 'select', item: T): void
```

A suggestion row was picked (click or Enter). Not fired for typed text; use `findEntityByName` for that.

## Helpers

Both live in `app/utils/index.ts` and are auto-imported.

| Helper                        | Returns                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `findEntityByName(text, all)` | The first entity whose `name` equals `text` (trimmed, case-insensitive), or `undefined` |
| `isNewEntityName(text, all)`  | `true` when `text` is non-blank and matches no entity exactly — when the add row shows  |

## Dependencies

- reka-ui `ComboboxRoot`, `ComboboxPortal`, `useFilter`
- shadcn-vue `ComboboxAnchor`, `ComboboxInput`, `ComboboxTrigger`, `ComboboxList`, `ComboboxGroup`, `ComboboxItem`, `ComboboxItemIndicator`, `ComboboxEmpty`
