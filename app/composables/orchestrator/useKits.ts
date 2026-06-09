import type {
  KitSummary,
  Kit,
  KitInstallation,
  InstallKitRequest,
  InstallKitResponse,
  UpgradeKitRequest,
  UpgradeKitResponse,
  UninstallKitRequest,
  UninstallKitResponse,
} from '#shared/types';

/** Install state of a catalog kit relative to what's installed in the account. */
export type KitInstallStatus = 'available' | 'installed' | 'update-available';

interface UseKitsReturnType {
  kits: Ref<KitSummary[]>;
  installations: Ref<KitInstallation[]>;
  loading: Ref<boolean>;
  error: Ref<boolean>;
  categories: ComputedRef<string[]>;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  getKit: (id: string) => Promise<Kit>;
  installationForKit: (kitId: string) => KitInstallation | undefined;
  statusForKit: (kitId: string) => KitInstallStatus;
  install: (
    id: string,
    data?: InstallKitRequest,
  ) => Promise<InstallKitResponse>;
  upgrade: (
    installationId: string,
    data?: UpgradeKitRequest,
  ) => Promise<UpgradeKitResponse>;
  uninstall: (
    installationId: string,
    data?: UninstallKitRequest,
  ) => Promise<UninstallKitResponse>;
}

/**
 * Compare two dotted version strings (e.g. "1.2.0" vs "1.3.0").
 * Returns 1 if a > b, -1 if a < b, 0 if equal. Falls back to string
 * comparison for non-numeric segments so it never throws on odd inputs.
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.');
  const pb = b.split('.');
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = Number(pa[i] ?? 0);
    const nb = Number(pb[i] ?? 0);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      const sa = pa[i] ?? '';
      const sb = pb[i] ?? '';
      if (sa !== sb) return sa > sb ? 1 : -1;
      continue;
    }
    if (na !== nb) return na > nb ? 1 : -1;
  }
  return 0;
}

/**
 * Shared data + actions for the kit catalog and installed kits.
 *
 * Fetches the provider catalog and the account's installations together so
 * the browse page can badge kits as installed / update-available. Pages call
 * `load()` (e.g. in `onMounted`) and own their own toasts/result UI; the
 * action wrappers refresh installations after a successful mutation.
 */
export function useKits(): UseKitsReturnType {
  const { orchestratorApi } = useGeinsRepository();
  const { geinsLog } = useGeinsLog('useKits');

  const kits = ref<KitSummary[]>([]);
  const installations = ref<KitInstallation[]>([]);
  const loading = ref(true);
  const error = ref(false);

  const load = async () => {
    loading.value = true;
    error.value = false;
    // Load the catalog and installations independently: installations only
    // drive the "installed / update-available" badges, so a failure there
    // (e.g. endpoint not yet available) must NOT wipe out the catalog list.
    const [catalogResult, installedResult] = await Promise.allSettled([
      orchestratorApi.kit.list(),
      orchestratorApi.kit.listInstallations(),
    ]);

    if (catalogResult.status === 'fulfilled') {
      kits.value = Array.isArray(catalogResult.value)
        ? catalogResult.value
        : [];
    } else {
      geinsLog('failed to load kit catalog', catalogResult.reason);
      error.value = true;
      kits.value = [];
    }

    if (installedResult.status === 'fulfilled') {
      installations.value = Array.isArray(installedResult.value)
        ? installedResult.value
        : [];
    } else {
      geinsLog('failed to load kit installations', installedResult.reason);
      installations.value = [];
    }

    loading.value = false;
  };

  const refreshInstallations = async () => {
    try {
      const installed = await orchestratorApi.kit.listInstallations();
      installations.value = Array.isArray(installed) ? installed : [];
    } catch (err) {
      geinsLog('failed to refresh installations', err);
    }
  };

  const categories = computed<string[]>(() => {
    const set = new Set<string>();
    for (const k of kits.value) {
      if (k.category) set.add(k.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  const installationForKit = (kitId: string): KitInstallation | undefined =>
    installations.value.find((i) => i.kitId === kitId);

  const statusForKit = (kitId: string): KitInstallStatus => {
    const installation = installationForKit(kitId);
    if (!installation) return 'available';
    const catalogKit = kits.value.find((k) => k.id === kitId);
    if (
      catalogKit &&
      compareVersions(catalogKit.version, installation.kitVersion) > 0
    ) {
      return 'update-available';
    }
    return 'installed';
  };

  const install = async (
    id: string,
    data?: InstallKitRequest,
  ): Promise<InstallKitResponse> => {
    const res = await orchestratorApi.kit.install(id, data);
    await refreshInstallations();
    return res;
  };

  const upgrade = async (
    installationId: string,
    data?: UpgradeKitRequest,
  ): Promise<UpgradeKitResponse> => {
    const res = await orchestratorApi.kit.upgradeByInstallation(
      installationId,
      data,
    );
    await refreshInstallations();
    return res;
  };

  const uninstall = async (
    installationId: string,
    data?: UninstallKitRequest,
  ): Promise<UninstallKitResponse> => {
    const res = await orchestratorApi.kit.uninstallByInstallation(
      installationId,
      data,
    );
    await refreshInstallations();
    return res;
  };

  return {
    kits,
    installations,
    loading,
    error,
    categories,
    load,
    refresh: load,
    getKit: (id: string) => orchestratorApi.kit.get(id),
    installationForKit,
    statusForKit,
    install,
    upgrade,
    uninstall,
  };
}
