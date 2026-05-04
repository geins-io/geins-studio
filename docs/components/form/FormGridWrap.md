# `FormGridWrap`

`FormGridWrap` is the container-query host for one or more [`FormGrid`](/components/form/FormGrid) blocks. It establishes the `form-grid` container so child grids collapse to a single column on narrow viewports.

## Features

- Sets up the `@container/form-grid` Tailwind container query
- Adds vertical spacing between stacked `FormGrid` blocks
- Use once per logical form section (card, panel, dialog body)

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

## Slots

### default

One or more [`FormGrid`](/components/form/FormGrid) blocks (or any other content needing the form-grid container query).

## Dependencies

- [`FormGrid`](/components/form/FormGrid) — children that depend on the container query
