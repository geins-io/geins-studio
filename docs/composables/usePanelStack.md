# `usePanelStack`

The `usePanelStack` composable tracks the global open order of stacking panels ("panel-on-panel"), so a base panel knows when another panel has opened on top of it.

:::tip TIP
This is used internally by [`PanelEdit`](/components/panel/PanelEdit) — if you build panels on top of `PanelEdit` you get stacking for free and never need to call this directly.
:::

## Why it exists

Stacking two Reka `Dialog`/`Sheet` panels means two trapped `FocusScope`s. Left unmanaged they fight — and a `MutationObserver` yanks focus back to the panel start, which is why an inline combobox inside a stacked panel loses focus on close.

The fix lives in the consumer: render **only the top panel as `modal`**. Then exactly one `FocusScope` traps at a time, and Reka's `hideOthers` marks every lower panel inert. `usePanelStack` provides the `isTop` / `hasPanelAbove` signals that drive that.

## Usage

```ts
const open = defineModel<boolean>('open');

const { isTop, hasPanelAbove } = usePanelStack(open);
```

```vue
<Sheet :open="open" :modal="isTop" @update:open="onOpenChange">
  <SheetContent
    :class="hasPanelAbove && 'pointer-events-none -translate-x-8 scale-[0.98]'"
  >
    …
  </SheetContent>
</Sheet>
```

Order equals open order — the last panel to open is the top. Only panels that call `usePanelStack` participate, so unrelated `Sheet`s elsewhere are unaffected. A panel unregisters when its `open` ref goes falsy and on scope dispose (route change / `v-if`).

## Parameters

### `open`

```ts
open: Ref<boolean | undefined>;
```

The panel's open state. The composable registers the panel while this is truthy and removes it when falsy.

## Returns

### `isTop`

```ts
isTop: ComputedRef<boolean>;
```

`true` when this is the top-most open panel — it should be `modal` and interactive.

### `hasPanelAbove`

```ts
hasPanelAbove: ComputedRef<boolean>;
```

`true` when another panel opened above this one — it should recede and go inert.

### `index`

```ts
index: ComputedRef<number>;
```

0-based position from the bottom of the stack (`-1` when closed).

## Type Definitions

```ts
function usePanelStack(open: Ref<boolean | undefined>): UsePanelStackReturn;

interface UsePanelStackReturn {
  isTop: ComputedRef<boolean>;
  hasPanelAbove: ComputedRef<boolean>;
  index: ComputedRef<number>;
}
```
