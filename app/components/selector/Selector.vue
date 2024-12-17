<script setup lang="ts" generic="T">
const { geinsLog } = useGeinsLog();

const props = withDefaults(
  defineProps<{
    mode: 'simple' | 'advanced';
    selection: SelectorSelection;
  }>(),
  {
    mode: 'simple',
  },
);

const selection = ref(props.selection);

const addToManuallySelected = (id: number) => {
  console.log('🚀 ~ addToManuallySelected ~ id:', id);
  selection.value.ids?.push(id);
};
const openBrowse = () => {
  geinsLog('selector_browse_opened');
};
</script>
<template>
  <div class="mb-6 flex items-start justify-between">
    <slot name="header">
      <SelectorHeader />
    </slot>
    <slot name="search">
      <SelectorSearch
        @add="addToManuallySelected($event)"
        @browse="openBrowse"
      />
    </slot>
  </div>
  <div>
    <slot name="selection" />
    <slot />
    <slot name="list">
      {{ selection }}
    </slot>
  </div>
</template>
