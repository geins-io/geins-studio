# `PriceListRule`

`PriceListRule` is a single row in the price-list rules editor — a `<tr>` with quantity, margin / discount / price inputs (depending on mode), per-row apply state, and Apply / Apply overwrite / Remove actions. Used inside [`PriceListRules`](/components/price-list/PriceListRules).

## Features

- Three modes via `mode` prop:
  - `margin` — quantity + margin %
  - `discount` — quantity + discount %
  - `all` — quantity + margin + discount + currency price (for the volume-pricing sheet)
- Two-way `v-model` on every editable field (`quantity`, `margin`, `discount`, `price`, `applied`)
- Quantity validation: must be > 1 (validates only after blur)
- `applied` is computed from "values match initial values" — the parent watches it to show the green check
- Disabled state for global rules in `all` mode (read-only preview)
- Per-row loading dot — shows a spinner on inputs that aren't the one the user just changed
- Apply button (current row) and Apply overwrite (also clears manual product overrides)
- Remove button always present

## Usage

`PriceListRule` is mounted inside [`PriceListRules`](/components/price-list/PriceListRules) — direct usage is rare. The parent renders one `<PriceListRule>` per rule and propagates updates back through the rule list.

## Props

### `mode`

```ts
mode?: 'margin' | 'discount' | 'all'
```

Which input columns render.

- **Default:** `'margin'`

### `index`

```ts
index: number
```

Row index used by the parent for loading-state targeting.

### `currency`

```ts
currency?: string
```

Currency descriptor for the price input (only in `all` mode).

### `loading`

```ts
loading?: boolean
```

When `true`, inputs that didn't change show a spinner placeholder.

- **Default:** `false`

### `lastFieldChanged`

```ts
lastFieldChanged?: PriceListRuleField  // 'price' | 'margin' | 'discountPercent'
```

Drives which input *isn't* spinner-loading-masked.

### `global`

```ts
global?: boolean
```

When `true` (and mode is `all`), disables every input — the row is a read-only preview of a global rule.

- **Default:** `false`

## v-model

### `quantity` / `margin` / `discount` / `price` / `applied`

```ts
v-model:quantity: number | undefined
v-model:margin: number | undefined
v-model:discount: number | undefined
v-model:price: number | undefined
v-model:applied: boolean
```

`applied` is the "values match initial values" computed flag.

## Events

### `apply`

Emitted when the user clicks Apply.

### `apply-overwrite`

Emitted when the user clicks "Apply overwrite" (variant that nukes manual overrides).

### `remove`

Emitted when the user clicks the Remove (X) button.

## Dependencies

- shadcn-vue `Input`, `Button`
- Lucide icons: `LoaderCircle`, `CircleCheck`, `CircleDashed`, `X`
