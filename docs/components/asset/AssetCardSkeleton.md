# `AssetCardSkeleton`

`AssetCardSkeleton` is the loading placeholder for an [`AssetCard`](/components/asset/AssetCard) grid. It copies the card's shape so the grid doesn't jump when the real cards arrive: the same `Card` shell, a 3:2 thumbnail block, and a `p-3` / `gap-2` body with a name line, a type-badge pill, and a size/date footer.

Each body row is fixed to the height of the card row it stands in for — the name's `text-sm` line (`h-5`), the `sm` badge (`h-5`), and the `text-xs` footer (`h-4`). The optional folder and tag rows are left out, matching the most common card (no folder, no tags).

## Usage

```vue
<div
  v-if="loading"
  class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4"
>
  <AssetCardSkeleton v-for="n in 8" :key="n" />
</div>
```

Render it inside the same grid as the cards it replaces — the column width comes from the grid, not the skeleton. Used by the library grid (`pages/asset-library/index.vue`) and [`AssetPickerPanel`](/components/asset/AssetPickerPanel).

:::warning
If `AssetCard`'s thumbnail ratio, body padding/gaps, or row typography change, update this component to match — otherwise the grid jumps on load again.
:::

## Props

None.
