import type {
  DashboardLayoutItem,
  DashboardWidgetInstance,
} from '#shared/types';
import { defaultDashboardBoard } from '@/lib/dashboard';

interface UseDashboardReturnType {
  items: Ref<DashboardWidgetInstance[]>;
  layout: Ref<DashboardLayoutItem[]>;
}

/**
 * The start dashboard's board: the widgets on it (`items`) and where they sit
 * on the grid (`layout`), matched by `i`. Starts from the default board.
 *
 * @returns {UseDashboardReturnType} - The board state
 * @property {Ref<DashboardWidgetInstance[]>} items - Widgets on the board
 * @property {Ref<DashboardLayoutItem[]>} layout - Grid position and size per widget
 */
export const useDashboard = (): UseDashboardReturnType => {
  const board = defaultDashboardBoard();
  const items = ref<DashboardWidgetInstance[]>(board.items);
  const layout = ref<DashboardLayoutItem[]>(board.layout);

  return { items, layout };
};
