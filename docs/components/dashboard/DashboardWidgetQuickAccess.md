# `DashboardWidgetQuickAccess`

The Quick access dashboard widget: shortcuts to pages and actions as small linked tiles.

## How it works

- The shortcuts are `QUICK_ACCESS_SHORTCUTS` (`app/lib/dashboard.ts`). Each has a stable `id`, an icon, a URL from the entity registry (`entityNewUrl` / `entityListUrl`) and an i18n label (`t(labelKey, labelParams, labelCount)`).
- The instance's `config.shortcuts` (an id array) picks which show; without it, `DEFAULT_QUICK_ACCESS_SHORTCUTS`, the four links the start page had before the dashboard.
- Columns follow the widget's own width: one per 190px (`quickAccessColumns`), never more than there are shortcuts.
- Each tile is a `NuxtLink`, so it opens in a new tab with a middle click.
- When stacked on a phone, the widget is as tall as its content (`stackedHeight: 'auto'`).

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
