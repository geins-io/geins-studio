import type { RefreshHandler } from '@sidebase/nuxt-auth';
import { useAuth, useRuntimeConfig } from '#imports';

export class CustomRefreshHandler implements RefreshHandler {
  /** Result of `useAuth` composable, mostly used for session data/refreshing */
  auth?: ReturnType<typeof useAuth>;

  /** Runtime config is mostly used for getting provider data */
  runtimeConfig?: ReturnType<typeof useRuntimeConfig>;

  /** Refetch interval */
  refreshIntervalTimer?: ReturnType<typeof setInterval>;

  init(): void {
    this.runtimeConfig = useRuntimeConfig();
    this.auth = useAuth();

    const intervalTime = 14 * 60 * 1000; // 14 minutes in milliseconds, the access token is valid for 15 minutes
    this.refreshIntervalTimer = setInterval(() => {
      if (this.auth?.data.value) {
        this.auth.refresh();
      }
    }, intervalTime);
  }

  destroy(): void {
    // Clear refetch interval
    clearInterval(this.refreshIntervalTimer);

    // Release state
    this.auth = undefined;
    this.runtimeConfig = undefined;
  }
}

export default new CustomRefreshHandler();
