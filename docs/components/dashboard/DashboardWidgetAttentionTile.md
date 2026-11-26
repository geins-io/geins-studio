# `DashboardWidgetAttentionTile`

One Needs attention number as a widget of its own: a `bare` widget (no header) that's all [`DashboardAttentionCard`](/components/dashboard/DashboardAttentionCard.md) in its `tile` layout. Three registry types share it:

| Widget type                     | Number               |
| ------------------------------- | -------------------- |
| `attention-quotation-requests`  | Quotation requests   |
| `attention-expiring-quotations` | Quotations expiring  |
| `attention-failed-runs`         | Failed workflow runs |

## How it works

- `attentionTileKey(instance.type)` (`app/lib/dashboard-data.ts`) picks the number, and [`useDashboardAttention`](/composables/useDashboardAttention.md) is asked for that one only, so a failed-runs tile fetches workflow runs and no quotations.
- The tile is one link to the filtered list, except while the board is edited: then the whole card is the drag handle.
- Counting, links, loading and errors are the same as in [Needs attention](/components/dashboard/DashboardWidgetNeedsAttention.md).

## Props

| Prop       | Type                      | Meaning                                         |
| ---------- | ------------------------- | ----------------------------------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board; its type is the number |
