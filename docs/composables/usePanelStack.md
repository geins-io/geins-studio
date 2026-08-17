# `usePanelStack`

`usePanelStack` tracks the global open order of stacking panels ("panel-on-panel") and provides the shared teleport target that makes stacking automatic.

:::tip TIP
This is used internally by [`PanelEdit`](/components/panel/PanelEdit) — build panels on `PanelEdit` and you get stacking for free; you never call this directly.
:::

## How stacking works

The **first** panel to open is a modal Reka `Sheet` and registers a teleport container inside its content (`registerTarget`). Any panel opened **while another is already open** (`isStacked`) renders as a plain `fixed` slide-over and `<Teleport>`s into that container (`stackTarget`).

Because stacked panels land inside the bottom sheet's modal subtree, Reka's `hideOthers` never hides them and its focus trap reaches them — and the base sheet stays `modal` the whole time, so Reka never swaps its Dialog content (which would remount the base and wipe child form fields). The panel below recedes + goes `inert` (`hasPanelAbove`); layers order by `index`.

## Usage

```ts
const open = defineModel<boolean>('open');
const { index, hasPanelAbove, isStacked, stackTarget, registerTarget } =
  usePanelStack(open);
```

Bottom sheet registers the container; stacked panels teleport into it:

```vue
<!-- bottom (isStacked === false) -->
<SheetContent>
  <div><!-- receding content --></div>
  <div :ref="registerTarget" />
</SheetContent>

<!-- stacked (isStacked === true) -->
<Teleport :to="stackTarget" :disabled="!stackTarget">
  <div class="fixed inset-y-0 right-0" :style="{ zIndex: 50 + index * 10 }">…</div>
</Teleport>
```

Order equals open order — the last panel to open is the top. A panel unregisters when its `open` ref goes falsy and on scope dispose (route change / `v-if`).

## Parameters

### `open`

```ts
open: Ref<boolean | undefined>;
```

The panel's open state. The composable registers the panel while truthy, removes it when falsy.

## Returns

### `isStacked`

```ts
isStacked: ComputedRef<boolean>;
```

Latched when the panel opens: `true` if another panel was already open → render as a stacked slide-over rather than a modal sheet.

### `hasPanelAbove`

```ts
hasPanelAbove: ComputedRef<boolean>;
```

`true` when another panel opened above this one — it should recede and go inert.

### `index`

```ts
index: ComputedRef<number>;
```

0-based position from the bottom of the stack (`-1` when closed). Drives z-index layering.

### `isTop`

```ts
isTop: ComputedRef<boolean>;
```

`true` when this is the top-most open panel.

### `stackTarget`

```ts
stackTarget: Ref<HTMLElement | null>;
```

The bottom sheet's teleport container; stacked panels teleport into it.

### `registerTarget`

```ts
registerTarget: (el: Element | ComponentPublicInstance | null) => void;
```

Function ref the bottom sheet binds on its container element (`:ref="registerTarget"`) — sets the element on mount, clears on unmount.

## Type Definitions

```ts
function usePanelStack(open: Ref<boolean | undefined>): UsePanelStackReturn;

interface UsePanelStackReturn {
  index: ComputedRef<number>;
  isTop: ComputedRef<boolean>;
  hasPanelAbove: ComputedRef<boolean>;
  isStacked: ComputedRef<boolean>;
  stackTarget: Ref<HTMLElement | null>;
  registerTarget: (el: Element | ComponentPublicInstance | null) => void;
}
```
