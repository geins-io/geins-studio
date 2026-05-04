# `TableCellSwitch`

`TableCellSwitch` is an in-place toggle cell — a `Switch` that emits `change` when the user flips it. Use for boolean fields that should be editable directly from the list view (e.g. `active`, `published`).

## Features

- Emits `change` with the new boolean (not `update:modelValue`) — pair with a single-shot save handler
- Disabled state for read-only rows
- Centered alignment in the cell

## Usage

```ts
{
  id: 'active',
  cell: ({ row }) =>
    h(TableCellSwitch, {
      value: row.original.active,
      onChange: (value) => updateActive(row.original._id, value),
    }),
}
```

## Props

### `value`

```ts
value: boolean
```

Current toggle state.

### `disabled`

```ts
disabled?: boolean
```

Disables the switch.

- **Default:** `false`

## Events

### `change`

```ts
(value: boolean): void
```

Emitted with the new value when the user toggles.

## Dependencies

- shadcn-vue [`Switch`](/components/shadcn-vue)
