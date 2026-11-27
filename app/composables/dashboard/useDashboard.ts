import type {
  DashboardBoard,
  DashboardLayoutItem,
  DashboardTemplate,
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import {
  addDashboardWidget,
  cloneDashboardBoard,
  defaultDashboardBoard,
  packDashboardBoard,
  removeDashboardWidget,
  sameDashboardBoard,
} from '@/lib/dashboard';

interface UseDashboardReturnType {
  items: Ref<DashboardWidgetInstance[]>;
  layout: Ref<DashboardLayoutItem[]>;
  editing: Readonly<Ref<boolean>>;
  isDefault: ComputedRef<boolean>;
  startEdit: () => void;
  cancelEdit: () => void;
  doneEdit: () => void;
  removeWidget: (i: string) => void;
  addWidget: (type: DashboardWidgetType, at?: { x: number; y: number }) => void;
  resetToDefault: () => void;
  applyTemplate: (template: DashboardTemplate) => void;
  updateWidgetConfig: (i: string, config: Record<string, unknown>) => void;
  fitWidget: (i: string, h: number) => void;
}

/**
 * The start dashboard's board: the widgets on it (`items`) and where they sit
 * on the grid (`layout`), matched by `i`, plus the edit session. The board is
 * the user's saved one ([useDashboardStorage]) once user and account are
 * known, else the default. Editing starts from a copy of the board, so Cancel
 * puts it back exactly; leaving the page while editing drops the changes the
 * same way. Done and a widget's settings save it, except that a board equal
 * to the default clears the saved one instead.
 *
 * @returns {UseDashboardReturnType} - The board state and edit actions
 * @property {Ref<DashboardWidgetInstance[]>} items - Widgets on the board
 * @property {Ref<DashboardLayoutItem[]>} layout - Grid position and size per widget
 * @property {Readonly<Ref<boolean>>} editing - Whether the board is being edited
 * @property {ComputedRef<boolean>} isDefault - Whether the board is the default one
 * @property {function} startEdit - Starts editing from a copy of the board
 * @property {function} cancelEdit - Restores the copy and stops editing
 * @property {function} doneEdit - Keeps the changes, saves them (or clears the saved board when it's the default), stops editing
 * @property {function} removeWidget - Takes a widget and its layout entry off the board
 * @property {function} addWidget - Puts a new widget on the board, at a cell or at the bottom, as part of the edit session
 * @property {function} resetToDefault - Puts the default board back: inside the edit session while editing, else clearing the saved board
 * @property {function} applyTemplate - Replaces the board with a template's: inside the edit session while editing, else saving it
 * @property {function} updateWidgetConfig - Sets a widget's own settings and saves them right away
 * @property {function} fitWidget - Sets the height (grid rows) a widget that fits its content needs
 */
export const useDashboard = (): UseDashboardReturnType => {
  const storage = useDashboardStorage();

  const initial = defaultDashboardBoard();
  const items = ref<DashboardWidgetInstance[]>(initial.items);
  const layout = ref<DashboardLayoutItem[]>(initial.layout);

  const editing = ref(false);
  let snapshot: DashboardBoard | null = null;

  // Rows each content-fitted widget last reported. A fitted height follows the
  // widget's width and settings, not a saved layout, so it's put back over any
  // board that replaces the current one (Cancel, load, reset). Reactive, so
  // `isDefault` follows a refit.
  const fitted = reactive(new Map<string, number>());
  const withFittedHeights = (positions: DashboardLayoutItem[]) =>
    positions.map((position) => {
      const h = fitted.get(position.i);
      return h === undefined || h === position.h
        ? position
        : { ...position, h };
    });

  const current = (): DashboardBoard => ({
    items: items.value,
    layout: layout.value,
  });
  const apply = (next: DashboardBoard) => {
    items.value = next.items;
    layout.value = withFittedHeights(next.layout);
  };

  // Against the default as this page draws it: fitted heights, and the grid's
  // compaction moving the widgets below a refit
  const isDefault = computed(() => {
    const fallback = defaultDashboardBoard();
    return sameDashboardBoard(current(), {
      ...fallback,
      layout: withFittedHeights(fallback.layout),
    });
  });

  // The user can load after the page, and switching account swaps the board
  watch(
    storage.storageKey,
    (key) => {
      if (!key) return;
      snapshot = null;
      editing.value = false;
      apply(storage.load() ?? defaultDashboardBoard());
    },
    { immediate: true },
  );

  const startEdit = () => {
    if (editing.value) return;
    snapshot = cloneDashboardBoard(current());
    editing.value = true;
  };

  const cancelEdit = () => {
    if (snapshot) apply(snapshot);
    snapshot = null;
    editing.value = false;
  };

  // A default board is cleared, not saved, and Done without a change saves
  // nothing: either way the user keeps getting the default board as it grows
  const doneEdit = () => {
    const changed = !snapshot || !sameDashboardBoard(snapshot, current());
    snapshot = null;
    editing.value = false;
    if (isDefault.value) storage.clear();
    else if (changed) storage.save(current());
  };

  // While editing it's one more change in the session: Cancel brings the old
  // board back, Done clears it. Outside one (the empty board) it clears now.
  const resetToDefault = () => {
    apply(defaultDashboardBoard());
    if (!editing.value) storage.clear();
  };

  // Unlike the default, a template is the user's own choice, so it's saved:
  // right away outside an edit session, by Done inside one
  const applyTemplate = (template: DashboardTemplate) => {
    apply(packDashboardBoard(template.types));
    if (!editing.value) storage.save(current());
  };

  const removeWidget = (i: string) => {
    apply(removeDashboardWidget(current(), i));
  };

  // Always inside an edit session, so Cancel takes the widget back off
  const addWidget = (
    type: DashboardWidgetType,
    at?: { x: number; y: number },
  ) => {
    startEdit();
    apply(addDashboardWidget(current(), type, at));
  };

  // Settings save on their own, outside the layout edit session: during one,
  // the snapshot takes the new settings too, so Cancel keeps them and what's
  // saved is the last saved layout with them.
  const updateWidgetConfig = (i: string, config: Record<string, unknown>) => {
    const withConfig = (board: DashboardBoard): DashboardBoard => ({
      ...board,
      items: board.items.map((item) =>
        item.i === i ? { ...item, config } : item,
      ),
    });
    items.value = withConfig(current()).items;
    if (snapshot) snapshot = withConfig(snapshot);
    storage.save(snapshot ?? current());
  };

  // Not saved on its own: it's derived, and saving would make a user who never
  // changed anything keep this board instead of the default as it grows. A new
  // layout array makes the grid compact the widgets below. A refit during an
  // edit (the width crossing a column step) still counts as a change on Done.
  const fitWidget = (i: string, h: number) => {
    fitted.set(i, h);
    if (layout.value.some((position) => position.i === i && position.h !== h)) {
      layout.value = withFittedHeights(layout.value);
    }
  };

  return {
    items,
    layout,
    editing: readonly(editing),
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
  };
};
