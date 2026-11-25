# `DashboardAddWidgetPanel`

The start dashboard's Add widget panel: a right-hand sheet listing every widget in the registry (`DASHBOARD_WIDGETS`), for adding to the board in edit mode. The page opens it from **Add widget** in the edit header and from the empty board.

## How it works

- **Groups** follow `DASHBOARD_WIDGET_GROUPS` (Needs attention, Charts, Lists, Shortcuts; labels `dashboards.groups.*`). A group with no widgets, or none matching the search, is left out.
- **Search** matches the translated widget title, case-insensitively. It clears each time the panel opens. No match shows an `Empty` state.
- **Rows** show a grip, the registry icon, title and description, "N on board" when the board already has that widget (counted from `items`), and a **+** icon button with an "Add at the bottom" tooltip.
- **+** emits `add` with the widget type. The page adds it at the bottom (`addWidget(type)`) and closes the panel, so the new widget is in view.
- **Dragging a row** sets `dragType` to its type a tick after the drag starts (moving the dragged element in the same task cancels the drag in Chrome). While `dragType` is set, the sheet slides off-screen and its overlay clears, but stays open, because it holds the dragged row. [`DashboardBoard`](/components/dashboard/DashboardBoard.md) reads `dragType` as its `dropType`, shows the placeholder and emits `drop`; the page adds the widget there and closes the panel. A drag that ends anywhere else clears `dragType` and the panel slides back. A stacked board (phones, or the empty board's edit mode) takes no drops, so there only **+** adds.
- Built on `Sheet` directly rather than [`PanelEdit`](/components/panel/PanelEdit.md): there's nothing to save and no footer, and it needs the slide-away and `SheetContent`'s `overlayClass` while dragging. It's 420px wide, as in the prototype.

## Usage

```vue
<script setup lang="ts">
const { items, addWidget } = useDashboard();
const addOpen = ref(false);
const dropType = ref<DashboardWidgetType | null>(null);
</script>

<template>
  <DashboardAddWidgetPanel
    v-model:open="addOpen"
    v-model:drag-type="dropType"
    :items="items"
    @add="
      (type) => {
        addWidget(type);
        addOpen = false;
      }
    "
  />
</template>
```

## Props

| Prop       | Type                          | Meaning                                                      |
| ---------- | ----------------------------- | ------------------------------------------------------------ |
| `items`    | `DashboardWidgetInstance[]`   | The widgets on the board, for "N on board"                   |
| `open`     | `boolean`                     | `v-model:open`                                               |
| `dragType` | `DashboardWidgetType \| null` | `v-model:drag-type`, the widget being dragged onto the board |

## Events

| Event | Payload                     | When                  |
| ----- | --------------------------- | --------------------- |
| `add` | `type: DashboardWidgetType` | A row's + was clicked |
