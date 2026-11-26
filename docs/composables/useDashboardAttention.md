# `useDashboardAttention`

The Needs attention numbers a widget shows, each with its count and fetch state.

## How it works

- Each number is defined once in `DASHBOARD_ATTENTION` (`app/lib/dashboard-data.ts`): icon, tone, the filtered list it links to and its source. `DASHBOARD_ATTENTION_KEYS` is their display order.
- The counts come from [`useDashboardQuotations`](/composables/useDashboardQuotations.md) (`requests`, `expiring`) and [`useDashboardExecutions`](/composables/useDashboardExecutions.md) (`failed_runs`). Only the fetches the asked-for numbers need are set up, so a single failed-runs tile doesn't load every quotation.
- Each entry carries its own `loading`, `error` and `retry`, so one failed fetch doesn't hide the other numbers.

## Usage

```ts
// Needs attention: all three
const { entries, total } = useDashboardAttention(DASHBOARD_ATTENTION_KEYS);

// One tile
const { entries } = useDashboardAttention(['failed_runs']);
```

## Parameters

| Parameter | Type                      | Meaning                       |
| --------- | ------------------------- | ----------------------------- |
| `keys`    | `DashboardAttentionKey[]` | The numbers, in display order |

## Returns

| Property  | Type                                     | Meaning                                                                          |
| --------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `entries` | `ComputedRef<DashboardAttentionEntry[]>` | Each number: definition, `count`, `loading`, `error`, `retry`                    |
| `total`   | `ComputedRef<number \| undefined>`       | The numbers added up once all have loaded; `undefined` until then or on an error |
