<script setup lang="ts">
import { ComboboxPortal } from 'reka-ui';
import { Check, ChevronsUpDown, Search } from 'lucide-vue-next';
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    dataSet: PlainDataItem[];
    entityName?: string;
    autocomplete?: string;
    disableTeleport?: boolean;
  }>(),
  {
    disableTeleport: false,
  },
);
const model = defineModel<string>();

const findItem = (value: string | undefined) =>
  value
    ? props.dataSet.find((item: PlainDataItem) => item.value === value)
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
  // Skip if coming from search input
  if (isComingFromSearchInput.value) {
    isComingFromSearchInput.value = false;
    return;
  }

  if (event.relatedTarget && event.relatedTarget === event.currentTarget) {
    return;
  }

  // Only open on focus if not immediately after a click
  if (!wasOpenBeforeClick.value) {
    open.value = true;
  }

  // Reset click tracking flag
  wasOpenBeforeClick.value = false;
};

const handleBlur = (event: FocusEvent) => {
  // If tabbing out of the search input (not clicking within dropdown)
  const relatedTarget = event.relatedTarget as Node | null;
  const listElement = comboboxList.value;

  if (
    !relatedTarget ||
    (listElement &&
      typeof listElement.contains === 'function' &&
      !listElement.contains(relatedTarget))
  ) {
    open.value = false;

    // Set flag and focus the trigger to continue natural tab order
    isComingFromSearchInput.value = true;
    setTimeout(() => {
      if (trigger.value) {
        trigger.value.focus();
      }
    }, 0);
  }
};

// Handle pointer events (works for both mouse and touch)
const handlePointerDown = (event: PointerEvent) => {
  event.preventDefault();

  // Track if dropdown was open before interaction
  wasOpenBeforeClick.value = open.value;

  // Toggle the dropdown
  open.value = !open.value;
};

// Handle keyboard interaction
const handleKeyDown = () => {
  wasOpenBeforeClick.value = open.value;
  open.value = !open.value;
};
</script>

<template>
  <Combobox v-model="choice" v-model:open="open" by="label">
    <input
      v-if="autocomplete"
      v-model="model"
      tabindex="-1"
      data-hidden
      :autocomplete="autocomplete"
      class="pointer-events-none absolute h-0 opacity-0"
    />
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
        {{ choice?.label ?? t('select_entity', { entityName }) }}

        <ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
      </button>
    </ComboboxAnchor>
    <ComboboxPortal to="body" :disabled="disableTeleport">
      <ComboboxList
        ref="comboboxList"
        class="relative w-(--reka-popper-anchor-width)"
      >
        <div
          class="bg-card sticky top-0 z-50 w-full items-center rounded-t border-b"
        >
          <ComboboxInput
            ref="searchInput"
            class="focus:border-primary focus-visible:border-primary h-10 rounded-none border-0 border-b pl-9 focus:rounded-lg focus:border focus-visible:ring-0 focus-visible:outline-hidden"
            :placeholder="$t('search_entity', { entityName }) + '...'"
            autocomplete="off"
            @blur="handleBlur"
          />
          <span
            class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
          >
            <Search class="text-muted-foreground size-4" />
          </span>
        </div>

        <ComboboxEmpty>
          {{ $t('no_entity_found', { entityName }) }}
        </ComboboxEmpty>

        <ComboboxGroup class="max-h-[300px] overflow-auto">
          <ComboboxItem v-for="item in dataSet" :key="item.value" :value="item">
            {{ item.label }}

            <ComboboxItemIndicator>
              <Check :class="cn('ml-auto size-4')" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxPortal>
  </Combobox>
</template>
