# `AssetPickerHost`

`AssetPickerHost` mounts a **single app-wide instance** of [`AssetPickerPanel`](/components/asset/AssetPickerPanel), bound to the shared state from [`useAssetPicker`](/composables/useAssetPicker). It is the piece that makes the picker an imperative singleton: one panel, driven from anywhere.

:::warning Mounted once — don't place it on a page
`AssetPickerHost` lives in the default layout (`app/layouts/default.vue`), the signed-in shell. It's already in the tree on every signed-in page — open the picker with [`useAssetPicker`](/composables/useAssetPicker) or [`AssetPicker`](/components/asset/AssetPicker), never by rendering this component yourself.

It is **not** in `app.vue`: there it would also mount on the signed-out `auth` layout (login, reset password).
:::

## What it does

- Binds the panel's `open` to `useAssetPicker().isOpen` and its props to `useAssetPicker().options`.
- On `@confirm` → calls `confirm(assets)`, resolving the pending `open()` promise with the picks.
- On `@update:open = false` → calls `cancel()`, resolving the pending promise with `[]`.

It has no props, no slots, and no local state — all state is the shared module-level state in [`useAssetPicker`](/composables/useAssetPicker).

Mounted but closed, it makes no requests: the panel loads its assets and folders on the first open.

## Placement

```vue
<!-- app/layouts/default.vue -->
<SidebarInset>
  …
  <NuxtAnnouncer />
  <AssetPickerHost />
</SidebarInset>
```

## Related

- [`useAssetPicker`](/composables/useAssetPicker) — the service it's bound to
- [`AssetPicker`](/components/asset/AssetPicker) — declarative wrapper for triggers
- [`AssetPickerPanel`](/components/asset/AssetPickerPanel) — the panel UI it hosts
