# `Tag`

`Tag` is the shared read-only tag pill — the bordered-pill style used across the Selector, table cells, and cards. Use it for displaying tags/labels; it is **not** the editable [`TagsInput`](/components/shadcn-vue) form primitive, and it is distinct from [`Badge`](/components/StatusBadge) (which carries status/type color).

## Sizes

- **`default`** — Selector / table size (`text-xs`, with the Selector's `@2xl` bump to `text-sm`).
- **`sm`** — tighter card size (`text-[10px]`), e.g. asset cards and kit cards.

## Usage

```vue
<!-- read-only -->
<Tag label="machinery" size="sm" />

<!-- removable (Selector) -->
<Tag :label="label" removable @remove="onRemove" />

<!-- custom content via slot -->
<Tag><LucideStar class="size-3" /> featured</Tag>
```

## Props

### `label`

```ts
label?: string
```

Tag text. Omit when using the default slot.

### `size`

```ts
size?: 'sm' | 'default'
```

- **Default:** `'default'`

### `removable`

```ts
removable?: boolean
```

Shows a remove (×) button that emits `remove`. **Default:** `false`.

## Events

### `remove`

Emitted when the remove button is clicked (only rendered when `removable`).

## Slots

### default

Tag content; overrides `label`.

## Used by

[`SelectorTag`](/components/selector/SelectorTag) (removable), [`TableCellTags`](/components/table/cell/TableCellTags), `AssetCard`, and the integration-kit cards.
