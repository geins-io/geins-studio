# `DashboardAttentionCard`

One Needs attention number: an icon tinted with the number's tone, the count with its label, a short text and a link (with `ArrowUpRight`) to the list it counts. The [Needs attention widget](/components/dashboard/DashboardWidgetNeedsAttention.md) shows three as cards; a [single-number widget](/components/dashboard/DashboardWidgetAttentionTile.md) shows one as a tile.

## How it works

- The number comes as a `DashboardAttentionEntry` from [`useDashboardAttention`](/composables/useDashboardAttention.md): its definition (`DASHBOARD_ATTENTION` in `app/lib/dashboard-data.ts`: icon, tone, link), count and fetch state. Texts are `dashboards.attention.{key}.label` / `.text` / `.link`.
- **The whole card is one link** (`NuxtLink` to the filtered list). It's a plain `div` while the board is edited, so a click doesn't leave the page and drop the edit, and on an error.
- **Tones** use the status tone tokens: `info` (`bg-tone-info/10 text-tone-info`), `warning` (`bg-tone-warning-bg text-tone-warning`), `danger` (`bg-tone-danger/10 text-tone-danger`).
- **Loading:** a `Skeleton` where the count goes; label, text and link stay so nothing jumps. **Zero** shows as 0.
- **Error:** no count, the text says the number couldn't be loaded, and **Retry** (`ButtonIcon`) refetches. A compact error instead of the `Empty` state: a card is one row and a tile is 160px tall, too small for `Empty`.
- As a `card`, the link text hides below `sm`; as a `tile` it sits top right, opposite the icon.

## Props

| Prop     | Type                      | Default  | Meaning                                                          |
| -------- | ------------------------- | -------- | ---------------------------------------------------------------- |
| `entry`  | `DashboardAttentionEntry` | —        | The number: definition, count, `loading`, `error`, `retry`       |
| `layout` | `'card' \| 'tile'`        | `'card'` | A row in Needs attention, or a whole single-number widget's body |
