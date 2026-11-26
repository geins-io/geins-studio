# `DashboardQueueRow`

One row in a dashboard queue, linking to its quotation or workflow run: the company's initials in a grey circle, a title over a meta line, an age or expiry on the right and the status badge last, at the right edge.

## How it works

- The row is one `NuxtLink` to `item.to`; the title underlines on hover. While the board is edited it's a plain `div`, so a click doesn't leave the page and drop the edit.
- **Avatar**: when `item.avatar` (a company name) is set, its initials (`companyInitials` in `app/lib/dashboard-data.ts`: the first letter of its first two words) in the shadcn `Avatar`, tinted with the neutral tone.
- **Badge**: [`StatusBadge`](/components/StatusBadge.md) with `item.status`, and `item.statusLabel` as its text when set.

## Props

| Prop   | Type                 | Meaning                                                                              |
| ------ | -------------------- | ------------------------------------------------------------------------------------ |
| `item` | `DashboardQueueItem` | `id`, `to`, `title`, `meta`, and optional `aside`, `avatar`, `status`, `statusLabel` |
