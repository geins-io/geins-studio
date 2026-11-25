# `useDashboard`

The start dashboard's board state: the widgets on it, where they sit on the grid, and the edit session. The page calls it once and hands the state to [`DashboardBoard`](/components/dashboard/DashboardBoard.md).

Editing starts from a deep copy of the board (`cloneDashboardBoard`), because the grid moves layout items in place while dragging. **Cancel** puts that copy back exactly; **Done** keeps the changes. The state lives in the page, so leaving the page while editing drops the changes like Cancel, with no dialog.

## Saving

The board is saved per user and account through [`useDashboardStorage`](/composables/useDashboardStorage.md):

- It starts as `defaultDashboardBoard()` and switches to the saved board as soon as the user and account are known (`storageKey`). A user who never saved keeps the default, so a default that grows in later phases reaches them; a user who saved keeps their own. A new account key loads that account's board.
- **Done** saves the board, but only if it changed: Done without a change saves nothing, so the user keeps getting the default. Cancel and leaving the page save nothing.
- `resetToDefault` replaces the board with the default one and saves it (the empty board's "Use the default dashboard").
- `fitWidget` sets the height a widget that fits its content needs (see [`DashboardWidget`](/components/dashboard/DashboardWidget.md#fitting-the-content)). It isn't saved on its own: the height follows the widget's width and settings, and saving it would turn a user who never changed anything into one with a saved board. It's remembered per widget and put back over any board that replaces the current one (Cancel, a loaded board, the default), and it replaces the `layout` array so the grid compacts the widgets below.
- `updateWidgetConfig` sets one widget's own settings (`items[].config`, e.g. Quick access shortcuts) and saves right away, apart from the layout edit session: during one, the copy Cancel restores takes the new settings too, and what's saved is the last saved layout with them.

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
  resetToDefault,
  updateWidgetConfig,
  fitWidget,
} = useDashboard();
```

## Returns

| Property             | Type                                                   | Meaning                                                        |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------------------- |
| `items`              | `Ref<DashboardWidgetInstance[]>`                       | The widgets on the board (`i`, `type`, `config`)               |
| `layout`             | `Ref<DashboardLayoutItem[]>`                           | Grid position and size per widget, matched by `i`              |
| `editing`            | `Readonly<Ref<boolean>>`                               | Whether the board is being edited                              |
| `startEdit`          | `() => void`                                           | Copies the board and starts editing (a second call is ignored) |
| `cancelEdit`         | `() => void`                                           | Puts the copy back and stops editing                           |
| `doneEdit`           | `() => void`                                           | Keeps the changes, saves them if there are any, stops editing  |
| `removeWidget`       | `(i: string) => void`                                  | Takes a widget and its layout entry off the board              |
| `resetToDefault`     | `() => void`                                           | Replaces the board with the default one and saves it           |
| `updateWidgetConfig` | `(i: string, config: Record<string, unknown>) => void` | Sets a widget's own settings and saves them right away         |
| `fitWidget`          | `(i: string, h: number) => void`                       | Sets the grid rows a content-fitted widget needs (not saved)   |

## Related

- [Dashboard domain](/domains/dashboard.md): the widget registry and the data behind each widget
