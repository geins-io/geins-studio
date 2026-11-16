<script setup lang="ts" generic="T extends EntityBaseWithName">
import { useEventListener } from '@vueuse/core';
import { ComboboxPortal, ComboboxRoot, useFilter } from 'reka-ui';
import type { EntityBaseWithName } from '#shared/types';
import type { HTMLAttributes } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    dataSet?: T[];
    entityKey: string;
    heading?: string;
    placeholder?: string;
    disabled?: boolean;
    disableTeleport?: boolean;
  }>(),
  {
    dataSet: () => [],
    heading: undefined,
    placeholder: '',
    disabled: false,
    disableTeleport: false,
  },
);
const emit = defineEmits<{
  select: [item: T];
}>();
// A form seeded from the API can pass null.
const model = defineModel<string | null>({ default: '' });
const text = computed({
  get: () => model.value ?? '',
  set: (value: string) => {
    model.value = value;
  },
});

// The class goes on the root; the rest (FormControl's id/aria-*, vee-validate's
// name/onBlur) on the input, like `Input`.
const attrs = useAttrs();
const rootClass = computed(() =>
  cn('relative', attrs.class as HTMLAttributes['class']),
);
const inputAttrs = computed(() => {
  const { class: _, ...rest } = attrs;
  return rest;
});

const ADD_NEW_VALUE = '__add_new__';
const root = useTemplateRef('root');
const listId = useId();
const open = ref(false);
// Filter only while typing: opening by focus, click, arrow keys or the
// chevron shows every suggestion.
const typing = ref(false);

watch(open, (isOpen) => {
  if (!isOpen) typing.value = false;
});

const { contains } = useFilter({ sensitivity: 'base' });
const suggestions = computed(() => {
  const query = text.value.trim();
  return typing.value && query
    ? props.dataSet.filter((item) => contains(item.name, query))
    : props.dataSet;
});
const match = computed(() => findEntityByName(text.value, props.dataSet));
const showAddNewOption = computed(() =>
  isNewEntityName(text.value, props.dataSet),
);

// When the list unmounts, reka's FocusScope refocuses the input and selects its
// text: after Tab or a click elsewhere that drags focus back, and the focus
// reopens the list. Focus stays in the input while the list is open, so skip it.
// The scope's container is the list itself or, in popper mode, its wrapper.
const listSelector = `[data-combobox-list="${CSS.escape(listId)}"]`;
useEventListener(
  document,
  'focusScope.autoFocusOnUnmount',
  (event) => {
    const scope = event.target;
    if (
      scope instanceof Element &&
      (scope.matches(listSelector) || scope.querySelector(listSelector))
    ) {
      event.preventDefault();
    }
  },
  { capture: true },
);

// reka highlights the first row on open and on every keystroke, so Enter would
// swap the typed text for the first suggestion. Point it at the exact match or
// the add row instead; a frame runs after reka's nextTick chain, before paint.
watch(
  [open, text],
  ([isOpen]) => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const target =
        match.value?._id ?? (showAddNewOption.value ? ADD_NEW_VALUE : null);
      if (target) root.value?.highlightItem?.(target);
    });
  },
  { flush: 'post' },
);

const showAll = () => {
  typing.value = false;
  open.value = true;
};

const handleFocus = () => {
  if (!open.value) showAll();
};

const handleSelect = (item: T) => {
  text.value = item.name;
  open.value = false;
  emit('select', item);
};

const close = () => {
  open.value = false;
};
</script>

<template>
  <ComboboxRoot
    ref="root"
    v-model:open="open"
    :model-value="match?._id"
    :disabled="disabled"
    :ignore-filter="true"
    :reset-search-term-on-blur="false"
    :reset-search-term-on-select="false"
    :class="rootClass"
  >
    <ComboboxAnchor class="relative w-full">
      <ComboboxInput
        v-model="text"
        v-bind="inputAttrs"
        :placeholder="placeholder"
        class="bg-input focus:border-primary h-10 rounded-lg border py-1 pr-9 pl-2 sm:pl-3"
        @focus="handleFocus"
        @click="showAll"
        @input="typing = true"
        @keydown.enter.prevent="close"
        @keydown.tab="close"
      />
      <ComboboxTrigger
        tabindex="-1"
        :aria-label="$t('show_entity', { entityKey }, 2)"
        class="absolute inset-y-0 right-0 flex w-9 items-center justify-center disabled:cursor-not-allowed"
        @mousedown.prevent
      >
        <LucideChevronsUpDown class="size-4 opacity-50" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal to="body" :disabled="disableTeleport">
      <ComboboxList
        :data-combobox-list="listId"
        :position="disableTeleport ? 'inline' : 'popper'"
        :class="
          disableTeleport
            ? 'absolute z-10 mt-1 w-full'
            : 'w-(--reka-popper-anchor-width)'
        "
      >
        <ComboboxEmpty>
          {{ $t('add_entity_by_typing', { entityKey }) }}
        </ComboboxEmpty>
        <ComboboxGroup
          v-if="suggestions.length"
          :heading="heading"
          class="max-h-75 overflow-auto"
        >
          <!-- mousedown.prevent keeps focus in the input: rows are tabindex -1. -->
          <ComboboxItem
            v-for="item in suggestions"
            :key="item._id"
            :value="item._id"
            @mousedown.prevent
            @select.prevent="handleSelect(item)"
          >
            {{ item.name }}
            <ComboboxItemIndicator>
              <LucideCheck class="size-4" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup v-if="showAddNewOption">
          <ComboboxItem
            :value="ADD_NEW_VALUE"
            class="flex items-center justify-start"
            @mousedown.prevent
            @select.prevent="close"
          >
            <span class="text-muted-foreground text-xs">
              {{ $t('add_entity', { entityKey }) }}:
            </span>
            {{ text.trim() }}
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
