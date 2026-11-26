# `DashboardWidgetRecentAssets`

The Recently uploaded assets dashboard widget: the 10 newest files in the asset library (`DASHBOARD_LIST_LIMIT`) as a compact table (file, added), with the widget's **View all** link (`viewAll`) to the library.

## How it works

- `useAsyncData('dashboard-recent-assets')` asks for the newest live assets: `assetApi.find` with `all: true`, `sortBy: 'createdAt'`, `sortDirection: 'desc'`, `pageSize: 10`. `find` suppresses the global error toast; the widget shows the error itself.
- `useAsyncData('dashboard-users')` loads the account's users (`userApi.list()`) apart from the assets, so refreshing the list doesn't reload them. A failed user list doesn't fail the widget; it only leaves the raw uploader.
- The **File** column shows the asset's thumbnail ([`TableCellAssetThumbnail`](/components/table/cell/TableCellAssetThumbnail.md), the asset library's row thumbnail) beside the file name, over who uploaded it. The uploader is the asset's `createdBy` matched to a user by id or email (`findUserByRef` in `app/lib/dashboard.ts`): "You" for your own uploads, `fullName()` for another user, and the raw `createdBy` when no user matches or the user has no first or last name.
- The **Added** column shows `createdAt` relative to now (`useDate().formatRelativeDate`, e.g. "2 hours ago"), right-aligned.
- Clicking a file name opens the asset (while the board is edited the name is plain text, like the other lists' links) in an [`AssetDetailPanel`](/components/asset/AssetDetailPanel.md) inside the widget, as the asset library does. The panel mounts on the first click (its setup fetches tags) and opens a tick later, because it seeds its form when `open` changes.
- Closing the panel refreshes the widget, so a trash or a saved edit shows. A rename or move that answers `202` lands later as a background job; the widget refreshes again when a listed asset leaves `useBackgroundJobs().movingAssetIds`. A refresh keeps the rows on screen: the skeleton shows only while there's no data yet.
- The two columns are fixed column definitions rather than `getColumns` (which derives columns from the first row), so the empty state keeps its header.
- The rows render in a [`TableView`](/components/table/TableView.md#compact-mode-a-list-inside-a-card) in `TableMode.Compact`, which brings the loading skeleton, the error state with **Retry** (`refresh()`) and the empty state ("No assets").
- The dashboard's period and Channel / Market filters don't apply to it.

## Props

| Prop       | Type                      | Meaning                 |
| ---------- | ------------------------- | ----------------------- |
| `instance` | `DashboardWidgetInstance` | The widget on the board |
