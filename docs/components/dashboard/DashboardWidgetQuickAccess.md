# `DashboardWidgetQuickAccess`

The Quick access dashboard widget: shortcuts to pages and actions as small linked tiles.

## How it works

- The shortcuts are `QUICK_ACCESS_SHORTCUTS` (`app/lib/dashboard.ts`). Each has a stable `id`, an icon, a URL from the entity registry (`entityNewUrl` / `entityListUrl`) and an i18n label (`t(labelKey, labelParams, labelCount)`).
- The instance's `config.shortcuts` (an id array) picks which show, in catalog order (`quickAccessShortcutIds`); ids the catalog no longer has are dropped. Without it, `DEFAULT_QUICK_ACCESS_SHORTCUTS`, the four links the start page had before the dashboard. An empty choice shows "No shortcuts chosen yet.".
- **Choosing shortcuts**: the sliders button in the header ([`DashboardWidgetSettings`](/components/dashboard/DashboardWidgetSettings.md), tooltip "Choose shortcuts") opens a narrow panel with [`DashboardWidgetQuickAccessPicker`](/components/dashboard/DashboardWidgetQuickAccessPicker.md). Save stores the choice in the instance's `config` through the board's `updateConfig`, which saves it right away, in or outside edit mode. Cancel or closing drops the draft; saving the choice already shown stores nothing. Each Quick access widget on a board keeps its own choice.
- Columns follow the widget's own width: one per 190px (`quickAccessColumns`), never more than there are shortcuts. The widget is registered with `fit`, so its height follows the rows (see [`DashboardWidget`](/components/dashboard/DashboardWidget.md#fitting-the-content)) and the user resizes only its width. The tile rows (at least 38px each) share the height left under the whole grid rows, so the space above and below the tiles is the same at any width and shortcut count.
- Each tile is a `NuxtLink`, so it opens in a new tab with a middle click.
- When stacked on a phone, the widget is as tall as its content (`stackedHeight: 'auto'`).

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
