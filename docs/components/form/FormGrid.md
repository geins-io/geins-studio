# `FormGrid`

`FormGrid` lays children out in a 12-column responsive grid with one of nine preset column splits. Use inside a [`FormGridWrap`](/components/form/FormGridWrap) container.

## Features

- Nine preset column splits — `1`, `1+1`, `1+2`, `2+1`, `1+1+1` (default), `2+2`, `1+1+2`, `2+1+1`, `1+1+1+1`
- Container-query responsive: collapses to a single column at the wrap breakpoint (`@max-xl/form-grid`)
- Tighter spacing on small containers, looser on large

## Usage

### Basic Usage

```vue
<template>
  <FormGridWrap>
    <FormGrid design="2+1">
      <FormFieldName />
      <FormFieldStatus />
    </FormGrid>
    <FormGrid design="1+1+1">
      <FormFieldEmail />
      <FormFieldPhone />
      <FormFieldCountry />
    </FormGrid>
  </FormGridWrap>
</template>
```

## Props

### `design`

```ts
design?: '1+1+2' | '2+1+1' | '2+2' | '1+1+1+1' | '1+1+1' | '1+2' | '2+1' | '1+1' | '1'
```

Column split for direct children. Each digit represents a column unit on the 12-column grid (so `2+1` means `8+4`, `1+1+1` means `4+4+4`).

- **Default:** `'1+1+1'`

## Slots

### default

The form fields. Each direct child takes one column slot — the order matches the `design` left-to-right.

## Dependencies

- Must be wrapped by [`FormGridWrap`](/components/form/FormGridWrap) for container-query breakpoints to fire correctly.
