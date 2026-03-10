<script setup lang="ts">
import type { ChangelogEntry } from '#shared/types';

definePageMeta({
  layout: 'default',
});

const scope = 'pages/orders/quotation/[id].vue';
const route = useRoute();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);
const { changelogApi } = useGeinsRepository();

const quotationId = computed(() => route.params.id as string);
const createMode = computed(() => quotationId.value === 'new');

// =====================================================================================
// TABS
// =====================================================================================
const tabs = computed(() =>
  createMode.value ? [] : [t('general'), t('changelog.tab_title')],
);

const currentTab = ref(0);

// =====================================================================================
// CHANGELOG DATA
// =====================================================================================
const changelog = ref<ChangelogEntry[]>([]);
const changelogLoading = ref(false);
const changelogError = ref(false);

async function fetchChangelog() {
  if (createMode.value) return;
  changelogLoading.value = true;
  changelogError.value = false;
  try {
    changelog.value = await changelogApi.getForEntity(
      'quotation',
      quotationId.value,
    );
  } catch (err) {
    geinsLogError('Failed to fetch changelog', err);
    changelogError.value = true;
  } finally {
    changelogLoading.value = false;
  }
}

onMounted(() => {
  if (!createMode.value) {
    fetchChangelog();
  }
});
</script>

<template>
  <div>
    <ContentHeader
      :title="createMode ? $t('new_entity', { entityName: $t('quotation') }) : $t('quotation') + ' ' + quotationId"
    >
      <template v-if="!createMode" #tabs>
        <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
      </template>
    </ContentHeader>

    <ContentCard v-if="createMode">
      <p class="text-muted-foreground">Coming soon..</p>
    </ContentCard>

    <template v-else>
      <!-- General tab (placeholder) -->
      <ContentCard v-if="currentTab === 0">
        <p class="text-muted-foreground">Coming soon..</p>
      </ContentCard>

      <!-- Changelog tab -->
      <ContentCard v-else-if="currentTab === 1">
        <QuotationChangelog
          :data="changelog"
          :loading="changelogLoading"
          :error="changelogError"
          :on-retry="fetchChangelog"
        />
      </ContentCard>
    </template>
  </div>
</template>
