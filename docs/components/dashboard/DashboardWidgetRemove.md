# `DashboardWidgetRemove`

The ✕ icon button that takes a widget off the dashboard while the board is edited. [`DashboardWidget`](/components/dashboard/DashboardWidget.md) renders it in the header (or the top-right corner of a `bare` widget) only in edit mode. It has a "Remove" tooltip and `aria-label`, and emits `remove`; the widget frame turns that into the board's `remove(i)`.

## Events

| Event    | Payload | When             |
| -------- | ------- | ---------------- |
| `remove` | —       | The ✕ is clicked |
