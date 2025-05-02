<script setup lang="ts">
import { Check, ChevronsUpDown, Search } from 'lucide-vue-next';
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    dataSet: DataItem[];
    entityName?: string;
  }>(),
  {},
);
const model = defineModel<string>();

const findItem = (value: string | undefined) =>
  value
    ? props.dataSet.find((item: DataItem) => item.value === value)
    : undefined;

const choice = ref<DataItem | undefined>(findItem(model.value));

watch(choice, (newChoice) => {
  model.value = newChoice?.value ?? '';
});

watch([model, () => props.dataSet], ([newModelValue]) => {
  if (choice.value?.value !== newModelValue) {
    choice.value = findItem(newModelValue);
  }
});
</script>

<template>
  <Combobox v-model="choice" by="label">
    <ComboboxAnchor
      as-child
      class="pointer-events-auto flex h-10 w-full items-center justify-between rounded-lg border bg-input px-3 py-1 text-sm transition-colors data-[state=open]:border-primary"
    >
      <ComboboxTrigger as-child>
        <button type="button">
          {{ choice?.label ?? t('select_entity', { entityName }) }}

          <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
        </button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList class="relative w-[--reka-popper-anchor-width]">
      <div
        class="sticky top-0 z-50 w-full items-center rounded-t border-b bg-card"
      >
        <ComboboxInput
          class="pointer-events-auto h-10 rounded-none border-0 border-b pl-9 focus-visible:ring-0"
          :placeholder="t('search_entity', { entityName }) + '...'"
        />
        <span
          class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
        >
          <Search class="size-4 text-muted-foreground" />
        </span>
      </div>

      <ComboboxEmpty>
        {{ t('no_entity_found', { entityName }) }}
      </ComboboxEmpty>

      <ComboboxGroup>
        <ComboboxItem v-for="item in dataSet" :key="item.value" :value="item">
          {{ item.label }}

          <ComboboxItemIndicator>
            <Check :class="cn('ml-auto h-4 w-4')" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
