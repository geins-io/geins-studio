import type { DashboardBoard } from '#shared/types';
import {
  dashboardStorageKey,
  parseStoredDashboards,
  serializeDashboards,
} from '@/lib/dashboard';

interface UseDashboardStorageReturnType {
  storageKey: ComputedRef<string | null>;
  load: () => DashboardBoard | null;
  save: (board: DashboardBoard) => void;
}

/**
 * Where the start dashboard is kept: the browser's localStorage, one entry per
 * user and account. The only place that knows that, so saving on the server
 * later replaces this module and nothing else. Storage that is blocked or
 * full, and saved data that can't be read, never throw: `load` gives `null`
 * and the caller shows the default board.
 *
 * @returns {UseDashboardStorageReturnType} - The storage key and load/save
 * @property {ComputedRef<string | null>} storageKey - Key for the signed-in user and account; `null` until both are known
 * @property {function} load - The saved board, or `null` when there's none or it can't be read
 * @property {function} save - Saves the board
 */
export const useDashboardStorage = (): UseDashboardStorageReturnType => {
  const { geinsLogWarn } = useGeinsLog(
    'composables/dashboard/useDashboardStorage.ts',
  );
  const { user } = storeToRefs(useUserStore());
  const { accountKey } = useGeinsAuth();

  const storageKey = computed(() =>
    user.value?._id && accountKey.value
      ? dashboardStorageKey(accountKey.value, user.value._id)
      : null,
  );

  const load = (): DashboardBoard | null => {
    if (!storageKey.value) return null;
    try {
      const raw = localStorage.getItem(storageKey.value);
      if (!raw) return null;
      const board = parseStoredDashboards(JSON.parse(raw));
      if (!board) geinsLogWarn('saved dashboard unreadable, using default');
      return board;
    } catch (error) {
      geinsLogWarn('could not read saved dashboard', error);
      return null;
    }
  };

  const save = (board: DashboardBoard) => {
    if (!storageKey.value) {
      geinsLogWarn('no user or account yet, dashboard not saved');
      return;
    }
    try {
      localStorage.setItem(
        storageKey.value,
        JSON.stringify(serializeDashboards(board)),
      );
    } catch (error) {
      geinsLogWarn('could not save dashboard', error);
    }
  };

  return { storageKey, load, save };
};
