# `useDashboardExecutions`

The workflow runs in Orchestrator that failed in the last 24 hours, for the start dashboard.

## How it works

- `useAsyncData('dashboard-failed-executions')` calls `orchestratorApi.execution.list({ status: 'Failed', startedAfter })`, with `startedAfter` 24 hours before the fetch. Every widget that calls the composable shares the key and `dedupe: 'defer'`, so there's one request.
- `failedExecutions` (`app/lib/dashboard-data.ts`) then keeps runs whose status is `failed` (any case) and that started within those 24 hours, newest first, so the count stays right if the API ignores a filter.
- It's a `GET`, which never raises the global error toast; the widgets show a failure with Retry.
- Always the whole account as it is now; the dashboard's period and Channel / Market filters don't apply.

## Returns

| Property  | Type                          | Meaning                                                |
| --------- | ----------------------------- | ------------------------------------------------------ |
| `failed`  | `ComputedRef<ExecutionLog[]>` | Failed runs started in the last 24 hours, newest first |
| `loading` | `ComputedRef<boolean>`        | Whether the runs are being fetched                     |
| `error`   | `ComputedRef<boolean>`        | Whether the fetch failed                               |
| `refresh` | `() => Promise<void>`         | Fetches the runs again                                 |
