<script setup lang="ts">
import { ComboboxPortal } from 'reka-ui';
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    dataSet: PlainDataItem[];
    entityKey?: string;
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
const pendingReturnFocus = ref(false);

const focusTrigger = () => {
  // Guard handleFocus so re-focusing the trigger doesn't reopen the dropdown.
  isComingFromSearchInput.value = true;
  trigger.value?.focus();
};

// Return focus to the trigger when the list closes (after selecting an item or
// tabbing out of the search input).
//
// Teleport mode: the list is portaled to <body>, outside any panel focus trap,
// so closing then refocusing the trigger on the next tick is enough.
//
// Inline mode (disableTeleport): the list renders *inside* the host panel. For
// a Sheet/Dialog that panel is a *trapped* Reka FocusScope. When the list
// finally unmounts (delayed by its close animation), the trap's MutationObserver
// sees its lastFocusedElementRef — still the now-removed search input — gone and
// calls focus(container), yanking focus to the panel start. That fires after any
// setTimeout we could schedule, so we can't win on timing. Instead we flag a
// pending return and let reclaimTriggerFocus (a focusin listener) bounce focus
// back to the trigger if a containing ancestor steals it. See onMounted below.
const returnFocusToTrigger = () => {
  isComingFromSearchInput.value = true;
  open.value = false;
  if (props.disableTeleport) {
    pendingReturnFocus.value = true;
    focusTrigger();
  } else {
    setTimeout(focusTrigger, 0);
  }
};

// While a return-to-trigger is pending, the panel's focus trap may pull focus to
// a container that *wraps* the trigger (only a focus trap does this — a normal
// next field is never an ancestor of the trigger). Reclaim it to the trigger.
// Any other focus move means the user navigated on, so stop guarding.
const reclaimTriggerFocus = (event: FocusEvent) => {
  if (!pendingReturnFocus.value) return;
  const target = event.target as Node | null;
  const triggerEl = trigger.value;
  if (!triggerEl || !target) return;
  if (target === triggerEl) return;
  if (target instanceof Node && target.contains(triggerEl)) {
    focusTrigger();
  } else {
    pendingReturnFocus.value = false;
  }
};

onMounted(() => {
  document.addEventListener('focusin', reclaimTriggerFocus);
  onUnmounted(() => {
    document.removeEventListener('focusin', reclaimTriggerFocus);
  });
});

watch(choice, (newChoice) => {
  if (newChoice?.value === model.value) {
    return;
  }
  model.value = newChoice?.value ?? '';
  returnFocusToTrigger();
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
  const relatedTarget = event.relatedTarget as Node | null;
  const listElement = comboboxList.value;
  if (
    !relatedTarget ||
    (listElement &&
      typeof listElement.contains === 'function' &&
      !listElement.contains(relatedTarget))
  ) {
    open.value = false;
  }
};

const handleSearchTab = (event: KeyboardEvent) => {
  // Close and hand focus to the trigger (Tab again from there moves on to the
  // next field). returnFocusToTrigger keeps focus off <body> in inline mode.
  event.preventDefault();
  returnFocusToTrigger();
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
        {{ choice?.label ?? t('select_entity', { entityKey }) }}

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
            :placeholder="$t('search_entity', { entityKey }) + '...'"
            autocomplete="off"
            @blur="handleBlur"
            @keydown.tab="handleSearchTab"
          />
          <span
            class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
          >
            <LucideSearch class="text-muted-foreground size-4" />
          </span>
        </div>

        <ComboboxEmpty>
          {{ $t('no_entity_found', { entityKey }) }}
        </ComboboxEmpty>

        <ComboboxGroup class="max-h-75 overflow-auto">
          <ComboboxItem v-for="item in dataSet" :key="item.value" :value="item">
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
