import type {
  DashboardBoard,
  DashboardLayoutItem,
  DashboardWidgetInstance,
} from '#shared/types';
import {
  cloneDashboardBoard,
  defaultDashboardBoard,
  removeDashboardWidget,
} from '@/lib/dashboard';

interface UseDashboardReturnType {
  items: Ref<DashboardWidgetInstance[]>;
  layout: Ref<DashboardLayoutItem[]>;
  editing: Readonly<Ref<boolean>>;
  startEdit: () => void;
  cancelEdit: () => void;
  doneEdit: () => void;
  removeWidget: (i: string) => void;
}

/**
 * The start dashboard's board: the widgets on it (`items`) and where they sit
 * on the grid (`layout`), matched by `i`, plus the edit session. Editing
 * starts from a copy of the board, so Cancel puts it back exactly; leaving the
 * page while editing drops the changes the same way.
 *
 * @returns {UseDashboardReturnType} - The board state and edit actions
 * @property {Ref<DashboardWidgetInstance[]>} items - Widgets on the board
 * @property {Ref<DashboardLayoutItem[]>} layout - Grid position and size per widget
 * @property {Readonly<Ref<boolean>>} editing - Whether the board is being edited
 * @property {function} startEdit - Starts editing from a copy of the board
 * @property {function} cancelEdit - Restores the copy and stops editing
 * @property {function} doneEdit - Keeps the changes and stops editing
 * @property {function} removeWidget - Takes a widget and its layout entry off the board
 */
export const useDashboard = (): UseDashboardReturnType => {
  const board = defaultDashboardBoard();
  const items = ref<DashboardWidgetInstance[]>(board.items);
  const layout = ref<DashboardLayoutItem[]>(board.layout);

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

  const doneEdit = () => {
    snapshot = null;
    editing.value = false;
  };

  const removeWidget = (i: string) => {
    apply(removeDashboardWidget(current(), i));
  };

  return {
    items,
    layout,
    editing: readonly(editing),
    startEdit,
    cancelEdit,
    doneEdit,
    removeWidget,
  };
};
