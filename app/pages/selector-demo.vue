<script setup lang="ts">
import { SelectorMode, SelectorSelectionStrategy } from '#shared/types';

definePageMeta({
  title: 'Selector Demo',
});

const tabs: {
  title: string;
  mode: SelectorMode;
  entity: string;
  selectionStrategy: SelectorSelectionStrategy;
  allowExclusions: boolean;
}[] = [
  {
    title: 'Products - Advanced + Strategy All',
    mode: SelectorMode.Advanced,
    entity: 'product',
    selectionStrategy: SelectorSelectionStrategy.All,
    allowExclusions: true,
  },
  {
    title: 'Products - Simple + Strategy None',
    mode: SelectorMode.Simple,
    entity: 'product',
    selectionStrategy: SelectorSelectionStrategy.None,
    allowExclusions: true,
  },
  {
    title: 'Languages - Simple + Strategy None + No Exclusions',
    mode: SelectorMode.Simple,
    entity: 'language',
    selectionStrategy: SelectorSelectionStrategy.None,
    allowExclusions: false,
  },
];
const currentTab = ref<number>(0);
const currentMode = computed<SelectorMode>(
  () => tabs[currentTab.value]?.mode || SelectorMode.Simple,
);
const currentEntityName = computed(
  () => tabs[currentTab.value]?.entity || 'product',
);
const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);
const accountStore = useAccountStore();
const { languages } = storeToRefs(accountStore);

const currentEntities = computed(() => {
  if (currentEntityName.value === 'product') {
    return products.value;
  }
  if (currentEntityName.value === 'language') {
    return languages.value;
  }
  return [];
});
const currentSelectionStrategy = computed<SelectorSelectionStrategy>(
  () =>
    tabs[currentTab.value]?.selectionStrategy || SelectorSelectionStrategy.All,
);
const currentAllowExclusions = computed(
  () => tabs[currentTab.value]?.allowExclusions,
);

const { getEmptyQuerySelectionBase, convertToSimpleSelectionBase } =
  useSelector();
const selection = ref<SelectorSelectionQueryBase>(getEmptyQuerySelectionBase());
const _simpleSelection = computed(() =>
  convertToSimpleSelectionBase(selection.value),
);
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader title="Selector Demo">
        <template #tabs>
          <ContentEditTabs
            v-model:current-tab="currentTab"
            :tabs="tabs.map((tab) => tab.title)"
            class="mt-5"
          />
        </template>
      </ContentHeader>
    </template>
    <ContentEditMain>
      <ContentCard>
        <Selector
          v-if="currentEntities?.length"
          v-model:selection="selection"
          :mode="currentMode"
          :entity-name="currentEntityName"
          :entities="currentEntities"
          :selection-strategy="currentSelectionStrategy"
          :allow-exclusions="currentAllowExclusions"
        />
      </ContentCard>
    </ContentEditMain>
  </ContentEditWrap>
</template>
