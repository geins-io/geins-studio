<script setup lang="ts">
import { ComboboxPortal } from 'reka-ui';
import type { Language } from '#shared/types';

const { t } = useI18n();

const model = defineModel<string>();

const props = withDefaults(
  defineProps<{
    dataSet?: Language[];
    disableTeleport?: boolean;
    showFlags?: boolean;
  }>(),
  {
    dataSet: () => [],
    disableTeleport: false,
    showFlags: false,
  },
);

const languages = computed<PlainDataItem[]>(() => {
  return props.dataSet.map((lang) => ({
    label: lang?.name || '',
    value: lang?._id || '',
  }));
});

const findItem = (value: string | undefined) =>
  value
    ? languages.value.find((item) => item.value === value)
    : undefined;

const choice = ref<PlainDataItem | undefined>(findItem(model.value));

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);
const comboboxList = ref<HTMLElement | null>(null);
const isComingFromSearchInput = ref(false);
const wasOpenBeforeClick = ref(false);

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

const handleFocus = async (event: FocusEvent) => {
  if (isComingFromSearchInput.value) {
    isComingFromSearchInput.value = false;
    return;
  }

  if (event.relatedTarget && event.relatedTarget === event.currentTarget) {
    return;
  }

  if (!wasOpenBeforeClick.value) {
    open.value = true;
  }

  wasOpenBeforeClick.value = false;
};

const handleBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as Node | null;
  const listElement = comboboxList.value;

  if (
    !relatedTarget ||
    (listElement &&
      typeof listElement.contains === 'function' &&
      !listElement.contains(relatedTarget))
  ) {
    open.value = false;

    isComingFromSearchInput.value = true;
    setTimeout(() => {
      if (trigger.value) {
        trigger.value.focus();
      }
    }, 0);
  }
};

const handlePointerDown = (event: PointerEvent) => {
  event.preventDefault();
  wasOpenBeforeClick.value = open.value;
  open.value = !open.value;
};

const handleKeyDown = () => {
  wasOpenBeforeClick.value = open.value;
  open.value = !open.value;
};
</script>

<template>
  <Combobox v-model="choice" v-model:open="open" by="label">
    <ComboboxAnchor
      as-child
      class="bg-input data-[state=open]:border-primary flex h-10 w-full items-center justify-between rounded-lg border px-3 py-1 text-sm transition-colors"
    >
      <button
        ref="trigger"
        type="button"
        tabindex="0"
        class="focus:border-primary focus-visible:border-primary w-full text-left focus-visible:ring-0 focus-visible:outline-hidden"
        @focus.prevent="handleFocus"
        @pointerdown.prevent="handlePointerDown"
        @keydown.enter.prevent="handleKeyDown"
      >
        <span v-if="choice" class="inline-flex items-center">
          <span
            v-if="showFlags"
            :class="flagClass(languageToCountryCode(choice.value))"
            class="mr-2 inline-block text-base"
          />
          {{ choice.label }}
        </span>
        <span v-else>{{ t('select_entity', { entityName: t('language') }) }}</span>

        <LucideChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
      </button>
    </ComboboxAnchor>
    <ComboboxPortal to="body" :disabled="disableTeleport">
      <ComboboxList
        ref="comboboxList"
        :position="disableTeleport ? 'inline' : 'popper'"
        :class="
          disableTeleport
            ? 'absolute z-10 mt-1 w-full'
            : 'relative w-(--reka-popper-anchor-width)'
        "
      >
        <div
          class="bg-card sticky top-0 z-50 w-full items-center rounded-t border-b"
        >
          <ComboboxInput
            ref="searchInput"
            class="focus:border-primary focus-visible:border-primary h-10 rounded-none border-0 border-b pl-9 focus:rounded-lg focus:border focus-visible:ring-0 focus-visible:outline-hidden"
            :placeholder="t('search_entity', { entityName: t('language') }) + '...'"
            autocomplete="off"
            @blur="handleBlur"
          />
          <span
            class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
          >
            <LucideSearch class="text-muted-foreground size-4" />
          </span>
        </div>

        <ComboboxEmpty>
          {{ t('no_entity_found', { entityName: t('language') }) }}
        </ComboboxEmpty>

        <ComboboxGroup class="max-h-75 overflow-auto">
          <ComboboxItem
            v-for="item in languages"
            :key="item.value"
            :value="item"
          >
            <span
              v-if="showFlags"
              :class="flagClass(languageToCountryCode(item.value))"
              class="mr-2 inline-block text-base"
            />
            {{ item.label }}

            <ComboboxItemIndicator>
              <LucideCheck :class="cn('ml-auto size-4')" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxPortal>
  </Combobox>
</template>
