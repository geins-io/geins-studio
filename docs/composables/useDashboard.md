# `useDashboard`

The start dashboard's board state: the widgets on it, where they sit on the grid, and the edit session. The page calls it once and hands the state to [`DashboardBoard`](/components/dashboard/DashboardBoard.md).

Editing starts from a deep copy of the board (`cloneDashboardBoard`), because the grid moves layout items in place while dragging. **Cancel** puts that copy back exactly; **Done** keeps the changes. The state lives in the page, so leaving the page while editing drops the changes like Cancel, with no dialog.

`resetToDefault` during an edit is one more change in the session: the default board replaces the current one, Cancel brings the old board back (settings included) and Done keeps the default. The page's **Reset to default** button calls it and is disabled while `isDefault`.

`applyTemplate(template)` replaces the board with a template's (`packDashboardBoard(template.types)`, see [Templates](/domains/dashboard.md)); the empty board's **Start from a template** rows call it. During an edit it's one more change in the session, like `resetToDefault`.

## Adding widgets

`addWidget(type, at?)` puts a new `type` widget on the board at its registry default size (`addDashboardWidget` in `app/lib/dashboard.ts`):

- Without `at` it goes on the left under every other widget (x 0, y = `dashboardBottom(layout)`), which is what the Add widget panel's **+** does.
- With `at` (`{ x, y }` in grid units) it goes to that cell, kept on the grid; that's a drop from the panel onto [`DashboardBoard`](/components/dashboard/DashboardBoard.md).
- Its id is the first free `{type}__{n}` (`nextDashboardWidgetId`), so the same widget can sit on the board more than once.
- It starts the edit session if one isn't running, so an addition is always something Cancel takes back and Done saves.

## Saving

The board is saved per user and account through [`useDashboardStorage`](/composables/useDashboardStorage.md):

- It starts as `defaultDashboardBoard()` and switches to the saved board as soon as the user and account are known (`storageKey`). A user who never saved keeps the default, so a default that grows in later phases reaches them; a user who saved keeps their own. A new account key loads that account's board.
- **Done** saves the board, but only if it changed, and never a default board: when `isDefault`, it clears the saved board instead (`storage.clear()`), so the user follows the default as it grows. Done without a change saves nothing. Cancel and leaving the page save nothing.
- `isDefault` compares the board with `defaultDashboardBoard()` as the page draws it: with the fitted heights put in, and both compacted the way the grid compacts them (`sameDashboardBoard` / `compactDashboardLayout` in `app/lib/dashboard.ts`). Without that, a Quick access fitted taller than its default moves every widget below it a row down, and the board would never count as the default.
- `resetToDefault` outside an edit (the empty board's "Use the default dashboard") replaces the board with the default one and clears the saved board right away.
- `applyTemplate` outside an edit saves the template's board right away: unlike the default, it's the user's own choice. During an edit, Done saves it.
- `fitWidget` sets the height a widget that fits its content needs (see [`DashboardWidget`](/components/dashboard/DashboardWidget.md#fitting-the-content)). It isn't saved on its own: the height follows the widget's width and settings, and saving it would turn a user who never changed anything into one with a saved board. It's remembered per widget and put back over any board that replaces the current one (Cancel, a loaded board, the default), and it replaces the `layout` array so the grid compacts the widgets below.
- `updateWidgetConfig` sets one widget's own settings (`items[].config`, e.g. Quick access shortcuts) and saves right away, apart from the layout edit session: during one, the copy Cancel restores takes the new settings too, and what's saved is the last saved layout with them. It saves the whole board, so changing a setting gives the user a saved board until server-side saving (Phase 5).

## Usage

```ts
const {
  items,
  layout,
  editing,
  isDefault,
  startEdit,
  cancelEdit,
  doneEdit,
  removeWidget,
  addWidget,
  resetToDefault,
  applyTemplate,
  updateWidgetConfig,
  fitWidget,
} = useDashboard();
```

## Returns

| Property             | Type                                                                 | Meaning                                                                       |
| -------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `items`              | `Ref<DashboardWidgetInstance[]>`                                     | The widgets on the board (`i`, `type`, `config`)                              |
| `layout`             | `Ref<DashboardLayoutItem[]>`                                         | Grid position and size per widget, matched by `i`                             |
| `editing`            | `Readonly<Ref<boolean>>`                                             | Whether the board is being edited                                             |
| `isDefault`          | `ComputedRef<boolean>`                                               | Whether the board is the default one (fitted heights, compacted)              |
| `startEdit`          | `() => void`                                                         | Copies the board and starts editing (a second call is ignored)                |
| `cancelEdit`         | `() => void`                                                         | Puts the copy back and stops editing                                          |
| `doneEdit`           | `() => void`                                                         | Keeps the changes and stops editing; saves them, or clears a default board    |
| `removeWidget`       | `(i: string) => void`                                                | Takes a widget and its layout entry off the board                             |
| `addWidget`          | `(type: DashboardWidgetType, at?: { x: number; y: number }) => void` | Puts a new widget at a cell, or at the bottom, in the edit session            |
| `resetToDefault`     | `() => void`                                                         | Puts the default board back: in the edit session, or clearing the saved board |
| `applyTemplate`      | `(template: DashboardTemplate) => void`                              | Replaces the board with a template's: in the edit session, or saving it       |
| `updateWidgetConfig` | `(i: string, config: Record<string, unknown>) => void`               | Sets a widget's own settings and saves them right away                        |
| `fitWidget`          | `(i: string, h: number) => void`                                     | Sets the grid rows a content-fitted widget needs (not saved)                  |

## Related

- [Dashboard domain](/domains/dashboard.md): the widget registry and the data behind each widget
