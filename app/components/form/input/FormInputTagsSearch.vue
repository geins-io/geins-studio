<script setup lang="ts" generic="T extends GeinsEntity">
import { get } from '@vueuse/core';
import {
  useFilter,
  type AcceptableValue,
  type ListboxItemSelectEvent,
} from 'reka-ui';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    dataSet?: T[];
    entityName?: string;
    placeholder?: string;
  }>(),
  {},
);
const dataSet = toRef(props, 'dataSet');
const model = defineModel<string[]>({
  default: () => [],
});
const open = ref(false);
const searchTerm = ref('');

const placeholder = computed(() => {
  if (props.placeholder) {
    return props.placeholder;
  }
  if (props.entityName) {
    return (
      t(
        'choose_entity',
        {
          entityName: props.entityName,
        },
        2,
      ) + '...'
    );
  }
  return '';
});

const { contains } = useFilter({ sensitivity: 'base' });
const filteredData = computed(() => {
  const options = dataSet.value?.filter(
    (i) => !model.value.includes(i._id || ''),
  );
  const returnVal = searchTerm.value
    ? options?.filter((option) => contains(option.name || '', searchTerm.value))
    : options;
  return returnVal;
});

const handleSelect = (event: ListboxItemSelectEvent<AcceptableValue>) => {
  if (typeof event.detail.value === 'string') {
    searchTerm.value = '';
    model.value.push(event.detail.value);
    open.value = false;
  }
};

const getName = (id: AcceptableValue): string => {
  const item = dataSet.value?.find((i) => i._id === id);
  return item?.name || '';
};
</script>
<template>
  <Combobox v-model="model" v-model:open="open" :ignore-filter="true">
    <ComboboxAnchor as-child>
      <TagsInput
        v-model="model"
        class="w-full gap-2 px-2"
        :display-value="getName"
      >
        <div class="flex flex-wrap items-center gap-2">
          <TagsInputItem v-for="id in model" :key="id" :value="id">
            <TagsInputItemText />
            <TagsInputItemDelete />
          </TagsInputItem>
        </div>

        <ComboboxInput v-model="searchTerm" as-child>
          <TagsInputInput
            :placeholder="placeholder"
            class="h-auto w-full min-w-[200px] border-none p-0 focus-visible:ring-0"
            @focus="open = true"
            @blur="open = false"
            @keydown.enter.prevent
          />
        </ComboboxInput>
      </TagsInput>

      <ComboboxList class="w-[--reka-popper-anchor-width]">
        <ComboboxEmpty />
        <ComboboxGroup>
          <ComboboxItem
            v-for="item in filteredData"
            :key="item._id"
            :value="item._id || ''"
            @select.prevent="handleSelect"
          >
            {{ item.name }}
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxAnchor>
  </Combobox>
</template>
