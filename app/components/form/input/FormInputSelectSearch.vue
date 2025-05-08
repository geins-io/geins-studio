<script setup lang="ts">
import { Check, ChevronsUpDown, Search } from 'lucide-vue-next';
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    dataSet: PlainDataItem[];
    entityName?: string;
  }>(),
  {},
);
const model = defineModel<string>();

const findItem = (value: string | undefined) =>
  value
    ? props.dataSet.find((item: PlainDataItem) => item.value === value)
    : undefined;

const choice = ref<PlainDataItem | undefined>(findItem(model.value));

watch(choice, (newChoice) => {
  if (newChoice?.value === model.value) {
    return;
  }
  model.value = newChoice?.value ?? '';
  open.value = false;
});

watch([model, () => props.dataSet], ([newModelValue]) => {
  if (choice.value?.value !== newModelValue) {
    choice.value = findItem(newModelValue);
  }
});

const open = ref(false);
const handleFocus = async (event: FocusEvent) => {
  await nextTick();
  console.log('relatedTarget:', event.relatedTarget);
  console.log('target:', event.target);
  console.log('🚀 ~ handleFocus ~ event:', event);
  if (event.relatedTarget && event.relatedTarget === event.currentTarget) {
    return;
  }
  open.value = true;
};
const handleClick = async (event: MouseEvent) => {
  await nextTick();

  console.log('CLICK relatedTarget:', event.relatedTarget);
  console.log('CLICK target:', event.target);
  console.log('🚀 ~ handleClick ~ event:', event);
};
</script>

<template>
  <Combobox v-model="choice" v-model:open="open" by="label">
    <ComboboxAnchor
      as-child
      class="pointer-events-auto flex h-10 w-full items-center justify-between rounded-lg border bg-input px-3 py-1 text-sm transition-colors data-[state=open]:border-primary"
    >
      <ComboboxTrigger as-child>
        <button
          type="button"
          tabindex="0"
          class="focus:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0"
          @focus="handleFocus"
          @click="handleClick"
        >
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
          @blur="open = false"
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
