<script setup lang="ts">
import { SelectorMode } from '#shared/types';

const tabs: { title: string; mode: SelectorMode; entity: string }[] = [
  {
    title: 'Products - Advanced',
    mode: SelectorMode.Advanced,
    entity: 'product',
  },
  { title: 'Products - Simple', mode: SelectorMode.Simple, entity: 'product' },
  {
    title: 'Languages - Simple',
    mode: SelectorMode.Simple,
    entity: 'language',
  },
];
const currentTab = ref<number>(0);
const currentMode = computed<SelectorMode>(
  () => tabs[currentTab.value]?.mode || SelectorMode.Simple,
);
const currentEntityName = computed(
  () => tabs[currentTab.value]?.entity || 'product',
);
const currentEntities = computed(() => {
  const { products } = useProductsStore();
  const { languages } = useAccountStore();
  if (currentEntityName.value === 'product') {
    return products;
  }
  if (currentEntityName.value === 'language') {
    return languages;
  }
  return [];
});

const { getEmptySelectionBase } = useSelector();
const selection = ref<SelectorSelectionBase>(getEmptySelectionBase());
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader title="Selector Demo">
        <template #tabs>
          <ContentTabs
            v-model:current-tab="currentTab"
            :tabs="tabs.map((tab) => tab.title)"
            class="mt-5"
          />
        </template>
      </ContentHeader>
    </template>
    <ContentEditMain :has-sidebar="false">
      <ContentCard>
        <Selector
          v-if="currentEntities?.length"
          v-model:selection="selection"
          :mode="currentMode"
          :entity-name="currentEntityName"
          :entities="currentEntities"
        />
      </ContentCard>
    </ContentEditMain>
  </ContentEditWrap>
</template>
