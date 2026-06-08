<script setup lang="ts">
import type { KitInstallation } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import { Card, CardContent } from '~/components/ui/card';

definePageMeta({
  pageType: 'default',
});

const { t } = useI18n();
const { toast } = useToast();
const { geinsLog } = useGeinsLog('pages/orchestrator/kits/installed.vue');
const breadcrumbsStore = useBreadcrumbsStore();

const {
  kits,
  installations,
  loading,
  error,
  load,
  refresh,
  upgrade,
  uninstall,
} = useKits();

watch(
  () => t('navigation.installed_kits'),
  (title) => breadcrumbsStore.setCurrentTitle(title, true),
  { immediate: true },
);

onMounted(load);

// ─── Update detection ──────────────────────────────────────────────
const latestVersionFor = (kitId: string): string | undefined =>
  kits.value.find((k) => k.id === kitId)?.version;

const compareVersions = (a: string, b: string): number => {
  const pa = a.split('.');
  const pb = b.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
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
};

const updateAvailableFor = (installation: KitInstallation): boolean => {
  const latest = latestVersionFor(installation.kitId);
  return !!latest && compareVersions(latest, installation.kitVersion) > 0;
};

// ─── Dialogs + actions ─────────────────────────────────────────────
const activeInstallation = ref<KitInstallation | null>(null);
const upgradeOpen = ref(false);
const uninstallOpen = ref(false);
const actionLoading = ref(false);

const onUpgrade = (installation: KitInstallation) => {
  activeInstallation.value = installation;
  upgradeOpen.value = true;
};

const onUninstall = (installation: KitInstallation) => {
  activeInstallation.value = installation;
  uninstallOpen.value = true;
};

const confirmUpgrade = async (payload: { force: boolean }) => {
  const installation = activeInstallation.value;
  if (!installation || actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await upgrade(installation.id, payload);
    toast({
      title: t('kits.upgrade_success'),
      description: t('kits.upgrade_success_detail', {
        name: res.kitName,
        from: res.previousVersion,
        to: res.newVersion,
      }),
    });
    upgradeOpen.value = false;
  } catch (err) {
    geinsLog('upgrade failed', err);
    toast({
      title: t('kits.upgrade_error'),
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  } finally {
    actionLoading.value = false;
  }
};

const confirmUninstall = async (payload: {
  workflows?: string[];
  deleteVariables: boolean;
}) => {
  const installation = activeInstallation.value;
  if (!installation || actionLoading.value) return;
  actionLoading.value = true;
  try {
    const res = await uninstall(installation.id, payload);
    toast({
      title: t('kits.uninstall_success'),
      description: t('kits.uninstall_success_detail', {
        name: installation.kitName,
        workflows: res.workflowsDeleted ?? 0,
      }),
    });
    uninstallOpen.value = false;
  } catch (err) {
    geinsLog('uninstall failed', err);
    toast({
      title: t('kits.uninstall_error'),
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  } finally {
    actionLoading.value = false;
  }
};
</script>

<template>
  <ContentHeader
    :title="$t('navigation.installed_kits')"
    :description="$t('kits.installed_description')"
  >
    <ContentActionBar>
      <ButtonIcon icon="new" href="/orchestrator/kits/list">
        {{ $t('kits.browse_kits') }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <NuxtErrorBoundary>
    <!-- Loading -->
    <div v-if="loading" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 3" :key="i" class="animate-pulse">
        <CardContent class="pt-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-muted size-10 rounded-lg" />
            <div class="space-y-2">
              <div class="bg-muted h-4 w-28 rounded" />
              <div class="bg-muted h-3 w-20 rounded" />
            </div>
          </div>
          <div class="bg-muted h-10 rounded" />
        </CardContent>
      </Card>
    </div>

    <!-- Error -->
    <Card v-else-if="error">
      <CardContent class="py-12">
        <div class="flex flex-col items-center justify-center text-center">
          <LucideXCircle class="text-destructive mb-4 size-12" />
          <h3 class="mb-2 text-lg font-medium">{{ $t('feedback_error') }}</h3>
          <p class="text-muted-foreground mb-4">
            {{ $t('error_empty_description') }}
          </p>
          <Button @click="refresh()">{{ $t('retry') }}</Button>
        </div>
      </CardContent>
    </Card>

    <!-- Empty -->
    <Card v-else-if="installations.length === 0">
      <CardContent class="py-12">
        <div class="flex flex-col items-center justify-center text-center">
          <LucidePackage class="text-muted-foreground mb-4 size-12" />
          <h3 class="mb-2 text-lg font-medium">
            {{ $t('kits.no_installations') }}
          </h3>
          <p class="text-muted-foreground mb-4">
            {{ $t('kits.no_installations_description') }}
          </p>
          <NuxtLink to="/orchestrator/kits/list">
            <Button>{{ $t('kits.browse_kits') }}</Button>
          </NuxtLink>
        </div>
      </CardContent>
    </Card>

    <!-- Installed grid -->
    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <WorkflowKitInstalledCard
        v-for="installation in installations"
        :key="installation.id"
        :installation="installation"
        :update-available="updateAvailableFor(installation)"
        :latest-version="latestVersionFor(installation.kitId)"
        @upgrade="onUpgrade"
        @uninstall="onUninstall"
      />
    </div>
  </NuxtErrorBoundary>

  <WorkflowKitUpgradeDialog
    v-model:open="upgradeOpen"
    :installation="activeInstallation"
    :latest-version="
      activeInstallation
        ? latestVersionFor(activeInstallation.kitId)
        : undefined
    "
    :loading="actionLoading"
    @confirm="confirmUpgrade"
  />

  <WorkflowKitUninstallDialog
    v-model:open="uninstallOpen"
    :installation="activeInstallation"
    :loading="actionLoading"
    @confirm="confirmUninstall"
  />
</template>
