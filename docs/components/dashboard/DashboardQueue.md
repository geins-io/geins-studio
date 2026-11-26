# `DashboardQueue`

A dashboard list of quotations or workflow runs as [`DashboardQueueRow`](/components/dashboard/DashboardQueueRow.md)s, with its states. The queue widgets render it in their body; the widget maps its data to `DashboardQueueItem`s.

## States

| State   | Shows                                                                                        |
| ------- | -------------------------------------------------------------------------------------------- |
| Loading | Four skeleton rows (with an avatar circle unless `withAvatar` is `false`)                    |
| Error   | `Empty` with the destructive media, "Something went wrong fetching {entities}" and **Retry** |
| Empty   | `Empty` with `emptyIcon` and `no_entity` ("No quotations")                                   |
| Rows    | One `DashboardQueueRow` per item                                                             |

The `Empty` states get less padding than their page-sized default (`p-2`), as the widget body is small.

## Props

| Prop         | Type                   | Default | Meaning                                                         |
| ------------ | ---------------------- | ------- | --------------------------------------------------------------- |
| `items`      | `DashboardQueueItem[]` | —       | The rows                                                        |
| `loading`    | `boolean`              | —       | Shows the skeleton                                              |
| `error`      | `boolean`              | —       | Shows the error state                                           |
| `onRetry`    | `() => void`           | —       | What **Retry** does; no button without it                       |
| `entityKey`  | `string`               | —       | i18n entity key for the empty and error texts                   |
| `emptyIcon`  | `Component`            | —       | Icon in the empty state (import it from `#components`)          |
| `withAvatar` | `boolean`              | `true`  | Whether the rows have a company avatar, so the skeleton matches |
