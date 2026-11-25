import type {
  DashboardBoard,
  DashboardLayoutItem,
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import {
  addDashboardWidget,
  cloneDashboardBoard,
  defaultDashboardBoard,
  removeDashboardWidget,
  serializeDashboards,
} from '@/lib/dashboard';

interface UseDashboardReturnType {
  items: Ref<DashboardWidgetInstance[]>;
  layout: Ref<DashboardLayoutItem[]>;
  editing: Readonly<Ref<boolean>>;
  startEdit: () => void;
  cancelEdit: () => void;
  doneEdit: () => void;
  removeWidget: (i: string) => void;
  addWidget: (type: DashboardWidgetType, at?: { x: number; y: number }) => void;
  resetToDefault: () => void;
  updateWidgetConfig: (i: string, config: Record<string, unknown>) => void;
}

/**
 * The start dashboard's board: the widgets on it (`items`) and where they sit
 * on the grid (`layout`), matched by `i`, plus the edit session. The board is
 * the user's saved one ([useDashboardStorage]) once user and account are
 * known, else the default. Editing starts from a copy of the board, so Cancel
 * puts it back exactly; leaving the page while editing drops the changes the
 * same way. Done and a widget's settings save it.
 *
 * @returns {UseDashboardReturnType} - The board state and edit actions
 * @property {Ref<DashboardWidgetInstance[]>} items - Widgets on the board
 * @property {Ref<DashboardLayoutItem[]>} layout - Grid position and size per widget
 * @property {Readonly<Ref<boolean>>} editing - Whether the board is being edited
 * @property {function} startEdit - Starts editing from a copy of the board
 * @property {function} cancelEdit - Restores the copy and stops editing
 * @property {function} doneEdit - Keeps the changes and saves them if there are any, stops editing
 * @property {function} removeWidget - Takes a widget and its layout entry off the board
 * @property {function} addWidget - Puts a new widget on the board, at a cell or at the bottom, as part of the edit session
 * @property {function} resetToDefault - Replaces the board with the default one and saves it
 * @property {function} updateWidgetConfig - Sets a widget's own settings and saves them right away
 */
export const useDashboard = (): UseDashboardReturnType => {
  const storage = useDashboardStorage();

  const initial = defaultDashboardBoard();
  const items = ref<DashboardWidgetInstance[]>(initial.items);
  const layout = ref<DashboardLayoutItem[]>(initial.layout);

  const editing = ref(false);
  let snapshot: DashboardBoard | null = null;

  const current = (): DashboardBoard => ({
    items: items.value,
    layout: layout.value,
  });
  const apply = (next: DashboardBoard) => {
    items.value = next.items;
    layout.value = next.layout;
  };

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

  // Done without a change saves nothing: a user who never saved keeps getting
  // the default board as it grows
  const doneEdit = () => {
    const changed =
      !snapshot ||
      JSON.stringify(serializeDashboards(snapshot)) !==
        JSON.stringify(serializeDashboards(current()));
    snapshot = null;
    editing.value = false;
    if (changed) storage.save(current());
  };

  const resetToDefault = () => {
    snapshot = null;
    editing.value = false;
    apply(defaultDashboardBoard());
    storage.save(current());
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

  return {
    items,
    layout,
    editing: readonly(editing),
    startEdit,
    cancelEdit,
    doneEdit,
    removeWidget,
    addWidget,
    resetToDefault,
    updateWidgetConfig,
  };
};
