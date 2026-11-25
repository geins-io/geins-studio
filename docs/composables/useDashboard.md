# `useDashboard`

The start dashboard's board state: the widgets on it, where they sit on the grid, and the edit session. The page calls it once and hands the state to [`DashboardBoard`](/components/dashboard/DashboardBoard.md).

Editing starts from a deep copy of the board (`cloneDashboardBoard`), because the grid moves layout items in place while dragging. **Cancel** puts that copy back exactly; **Done** keeps the changes. The state lives in the page, so leaving the page while editing drops the changes like Cancel, with no dialog.

## Usage

```ts
const {
  items,
  layout,
  editing,
  startEdit,
  cancelEdit,
  doneEdit,
  removeWidget,
} = useDashboard();
```

## Returns

| Property       | Type                             | Meaning                                                        |
| -------------- | -------------------------------- | -------------------------------------------------------------- |
| `items`        | `Ref<DashboardWidgetInstance[]>` | The widgets on the board (`i`, `type`, `config`)               |
| `layout`       | `Ref<DashboardLayoutItem[]>`     | Grid position and size per widget, matched by `i`              |
| `editing`      | `Readonly<Ref<boolean>>`         | Whether the board is being edited                              |
| `startEdit`    | `() => void`                     | Copies the board and starts editing (a second call is ignored) |
| `cancelEdit`   | `() => void`                     | Puts the copy back and stops editing                           |
| `doneEdit`     | `() => void`                     | Keeps the changes and stops editing                            |
| `removeWidget` | `(i: string) => void`            | Takes a widget and its layout entry off the board              |

The board starts from `defaultDashboardBoard()` (`app/lib/dashboard.ts`).

## Related

- [Dashboard domain](/domains/dashboard.md): the widget registry and the data behind each widget
