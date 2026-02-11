<script setup lang="ts" generic="T extends EntityBaseWithName">
import {
  useFilter,
  type AcceptableValue,
  type ListboxItemSelectEvent,
  ComboboxPortal,
} from 'reka-ui';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    dataSet?: T[];
    entityName?: string;
    placeholder?: string;
    allowCustomTags?: boolean;
    disableTeleport?: boolean;
  }>(),
  {
    allowCustomTags: false,
    disableTeleport: false,
  },
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
        'add_entity',
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
  const options = dataSet.value?.filter((i) => !model.value.includes(i._id));
  const returnVal = searchTerm.value
    ? options?.filter((option) =>
        contains(option.displayName || option.name || '', searchTerm.value),
      )
    : options;
  return returnVal;
});

const showAddNewOption = computed(() => {
  return (
    props.allowCustomTags && searchTerm.value && !filteredData.value?.length
  );
});

const handleSelect = (event: ListboxItemSelectEvent<AcceptableValue>) => {
  if (typeof event.detail.value === 'string') {
    searchTerm.value = '';
    model.value = [...model.value, event.detail.value];
    open.value = false;
  }
};

const handleAddNewOption = () => {
  if (searchTerm.value) {
    model.value = [...model.value, searchTerm.value];
    searchTerm.value = '';
    open.value = false;
  }
};

// Workaround for reka-ui v2.8.0 bug #2428 with open-on-focus
// Use click to open instead, which doesn't have the infinite loop issue
const handleInputClick = () => {
  if (!open.value) {
    open.value = true;
  }
};

// Close dropdown on Tab to allow navigating away from the field
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    open.value = false;
  }
};

const getName = (id: AcceptableValue): string => {
  return dataSet.value
    ? getEntityNameById(String(id), dataSet.value) || ''
    : '';
};
</script>
<template>
  <Combobox v-model="model" v-model:open="open" :ignore-filter="true">
    <ComboboxAnchor as-child>
      <TagsInput
        v-model="model"
        :class="
          cn('w-full gap-2 px-2', {
            'border-primary border': open,
          })
        "
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
            class="h-auto w-full min-w-50 border-none p-0 focus-visible:ring-0"
            @click="handleInputClick"
            @keydown="handleKeyDown"
            @keydown.enter.prevent
          />
        </ComboboxInput>
      </TagsInput>
    </ComboboxAnchor>
    <ComboboxPortal to="body" :disabled="disableTeleport">
      <ComboboxList
        :position="disableTeleport ? 'inline' : 'popper'"
        :class="
          disableTeleport
            ? 'absolute z-10 mt-1 w-full'
            : 'w-(--reka-popper-anchor-width)'
        "
      >
        <ComboboxEmpty v-if="allowCustomTags">
          {{ $t('add_entity_by_typing', { entityName }, 2) }}
        </ComboboxEmpty>
        <ComboboxEmpty v-else>
          {{ $t('no_entity', { entityName }, 2) }}
        </ComboboxEmpty>
        <ComboboxGroup>
          <ComboboxItem
            v-for="item in filteredData"
            :key="item._id"
            :value="item._id"
            @select.prevent="handleSelect"
          >
            {{ item.displayName || item.name }}
          </ComboboxItem>
        </ComboboxGroup>
        <ComboboxItem
          v-if="showAddNewOption"
          :value="searchTerm"
          class="flex items-center justify-start"
          @select.prevent="handleAddNewOption"
        >
          <span class="text-muted-foreground text-xs">
            {{ $t('add_entity', { entityName }) }}:
          </span>
          {{ searchTerm }}
        </ComboboxItem>
      </ComboboxList>
    </ComboboxPortal>
  </Combobox>
</template>
