<script setup lang="ts">
import type { KitSummary } from '#shared/types';
import { Card, CardContent } from '~/components/ui/card';

definePageMeta({
  pageType: 'default',
});

const { t } = useI18n();
const breadcrumbsStore = useBreadcrumbsStore();

const { kits, loading, error, categories, statusForKit, load, refresh } =
  useKits();

watch(
  () => t('navigation.kits'),
  (title) => breadcrumbsStore.setCurrentTitle(title, true),
  { immediate: true },
);

onMounted(load);

// ─── Filtering ─────────────────────────────────────────────────────
const search = ref('');
const activeCategory = ref<string | null>(null);

const filteredKits = computed<KitSummary[]>(() => {
  const term = search.value.trim().toLowerCase();
  return kits.value.filter((k) => {
    if (activeCategory.value && k.category !== activeCategory.value) {
      return false;
    }
    if (!term) return true;
    const haystack = [
      k.name,
      k.description ?? '',
      k.author,
      k.category ?? '',
      ...(k.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
});

// ─── Install wizard ────────────────────────────────────────────────
const installDialogOpen = ref(false);
const installKitId = ref<string | null>(null);

const openInstall = (kit: KitSummary) => {
  installKitId.value = kit.id;
  installDialogOpen.value = true;
};

const onManage = () => navigateTo('/orchestrator/kits/installed');

const onInstalled = async () => {
  await refresh();
};
</script>

<template>
  <ContentHeader
    :title="$t('navigation.kits')"
    :description="$t('kits.description')"
  >
    <ContentActionBar>
      <ButtonIcon
        icon="LayoutGrid"
        variant="secondary"
        href="/orchestrator/kits/installed"
      >
        {{ $t('kits.installed_kits') }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <!-- Search + category filter -->
  <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="relative w-full sm:max-w-xs">
      <LucideSearch
        class="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
      />
      <Input
        v-model="search"
        :placeholder="$t('kits.search_placeholder')"
        class="pl-8"
      />
    </div>
    <div v-if="categories.length" class="flex flex-wrap items-center gap-1.5">
      <Button
        size="sm"
        :variant="activeCategory === null ? 'default' : 'outline'"
        class="h-7 text-xs"
        @click="activeCategory = null"
      >
        {{ $t('kits.all_categories') }}
      </Button>
      <Button
        v-for="category in categories"
        :key="category"
        size="sm"
        :variant="activeCategory === category ? 'default' : 'outline'"
        class="h-7 text-xs"
        @click="activeCategory = category"
      >
        {{ category }}
      </Button>
    </div>
  </div>

  <NuxtErrorBoundary>
    <!-- Loading -->
    <div v-if="loading" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i" class="animate-pulse">
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
    <Card v-else-if="filteredKits.length === 0">
      <CardContent class="py-12">
        <div class="flex flex-col items-center justify-center text-center">
          <LucidePackage class="text-muted-foreground mb-4 size-12" />
          <h3 class="mb-2 text-lg font-medium">{{ $t('kits.no_kits') }}</h3>
          <p class="text-muted-foreground">
            {{ $t('kits.no_kits_description') }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Catalog grid -->
    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <WorkflowKitCard
        v-for="kit in filteredKits"
        :key="kit.id"
        :kit="kit"
        :status="statusForKit(kit.id)"
        @install="openInstall"
        @manage="onManage"
      />
    </div>
  </NuxtErrorBoundary>

  <WorkflowKitInstallDialog
    v-model:open="installDialogOpen"
    :kit-id="installKitId"
    @installed="onInstalled"
  />
</template>
