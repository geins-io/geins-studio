# `useDashboardStorage`

Where the start dashboard is kept: the browser's `localStorage`, one entry per user and account. It's the only place that knows that, so saving dashboards on the server later replaces this module and nothing else. [`useDashboard`](/composables/useDashboard.md) is its only caller.

## How it works

- **Key** `geins-dashboard-{accountKey}-{userId}` (`dashboardStorageKey`), from `useGeinsAuth().accountKey` and the user store. `storageKey` is `null` until both are known; nothing is read or written before that.
- **Saved shape** (`serializeDashboards`), versioned and ready for several dashboards, with layout trimmed to plain grid units (the grid adds flags of its own):

  ```json
  {
    "version": 1,
    "dashboards": [{ "id": "my-work", "items": [...], "layout": [...] }]
  }
  ```

- **Reading** (`parseStoredDashboards`, Zod) makes a saved board safe to render: widgets the registry no longer knows are dropped with their layout entries, a widget needs exactly one layout entry, and sizes are clamped to the widget's minimum and the 12 columns. Another version or anything unreadable gives `null`, and the caller shows the default board.
- **Never throws.** Blocked or full storage, and unreadable JSON, are logged with `useGeinsLog` and treated as "nothing saved".
- Plain `localStorage` calls rather than `useLocalStorage`: the board is read once per user and account and written on save, so a reactive binding would add nothing.

## Returns

| Property     | Type                              | Meaning                                                             |
| ------------ | --------------------------------- | ------------------------------------------------------------------- |
| `storageKey` | `ComputedRef<string \| null>`     | Key for the signed-in user and account; `null` until both are known |
| `load`       | `() => DashboardBoard \| null`    | The saved board, or `null` when there's none or it can't be read    |
| `save`       | `(board: DashboardBoard) => void` | Saves the board                                                     |

## Changing the saved shape

Bump `DASHBOARD_STORAGE_VERSION` (`app/lib/dashboard.ts`) and teach `parseStoredDashboards` to read the old version, or users with a saved board fall back to the default.
