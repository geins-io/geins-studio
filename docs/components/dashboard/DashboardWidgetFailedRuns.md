# `DashboardWidgetFailedRuns`

The Latest failed workflow runs dashboard widget: workflow runs in Orchestrator that failed in the last 24 hours, newest first, as a [`DashboardQueue`](/components/dashboard/DashboardQueue.md).

## How it works

- Reads `failed` from [`useDashboardExecutions`](/composables/useDashboardExecutions.md) (the same runs as the Needs attention number) and shows the newest 10 (`DASHBOARD_LIST_LIMIT`).
- Each row: the workflow name over "Orchestrator", how long ago it started, and a Failed badge (`danger`). No avatar. It links to the run (`/orchestrator/executions/{id}`).
- **View all** in the header opens `/orchestrator/executions?status=failed&period=24h`.
- Channel / Market don't apply to workflow runs.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
