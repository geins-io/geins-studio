# `useDashboard`

The start dashboard's board state: the widgets on it and where they sit on the grid. The page calls it once and hands the state to [`DashboardBoard`](/components/dashboard/DashboardBoard.md).

## Usage

```ts
const { items, layout } = useDashboard();
```

## Returns

| Property | Type                             | Meaning                                           |
| -------- | -------------------------------- | ------------------------------------------------- |
| `items`  | `Ref<DashboardWidgetInstance[]>` | The widgets on the board (`i`, `type`, `config`)  |
| `layout` | `Ref<DashboardLayoutItem[]>`     | Grid position and size per widget, matched by `i` |

The board starts from `defaultDashboardBoard()` (`app/lib/dashboard.ts`).

## Related

- [Dashboard domain](/domains/dashboard.md): the widget registry and the data behind each widget
