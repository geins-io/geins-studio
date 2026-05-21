<script setup lang="ts">
import { ComboboxPortal } from 'reka-ui';
import type { Market } from '#shared/types';

const { t } = useI18n();

const model = defineModel<string>();

const props = withDefaults(
  defineProps<{
    dataSet?: Market[];
    disableTeleport?: boolean;
    disabled?: boolean;
  }>(),
  {
    dataSet: () => [],
    disableTeleport: false,
    disabled: false,
  },
);

interface MarketDataItem extends PlainDataItem {
  countryCode: string;
}

const markets = computed<MarketDataItem[]>(() => {
  return props.dataSet.map((market) => ({
    label: `${market.country?.name ?? market._id} (${market.currency?._id ?? ''})`,
    value: market._id,
    countryCode: market.country?._id ?? '',
  }));
});

const findItem = (value: string | undefined) =>
  value ? markets.value.find((item) => item.value === value) : undefined;

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);
const comboboxList = ref<HTMLElement | null>(null);
const isComingFromSearchInput = ref(false);
const wasOpenBeforeClick = ref(false);

const choice = computed<MarketDataItem | undefined>({
  get: () => findItem(model.value),
  set: (newChoice) => {
    if (!newChoice) return;
    model.value = newChoice.value;
    open.value = false;
  },
});

const handleFocus = async (event: FocusEvent) => {
  if (props.disabled) return;
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
  if (props.disabled) return;
  wasOpenBeforeClick.value = open.value;
  open.value = !open.value;
};

const handleKeyDown = () => {
  if (props.disabled) return;
  wasOpenBeforeClick.value = open.value;
  open.value = !open.value;
};
</script>

<template>
  <Combobox
    v-model="choice"
    v-model:open="open"
    :disabled="disabled"
    by="label"
    class="relative"
  >
    <ComboboxAnchor
      as-child
      :class="[
        'bg-input data-[state=open]:border-primary flex h-10 w-full items-center justify-between rounded-lg border px-3 py-1 text-sm transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
      ]"
    >
      <button
        ref="trigger"
        type="button"
        tabindex="0"
        :disabled="disabled"
        class="focus:border-primary focus-visible:border-primary w-full text-left focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed"
        @focus.prevent="handleFocus"
        @pointerdown.prevent="handlePointerDown"
        @keydown.enter.prevent="handleKeyDown"
      >
        <span v-if="choice" class="inline-flex items-center gap-2">
          <div
            v-if="choice.countryCode"
            :class="[
              flagClass(choice.countryCode),
              'size-4.5 rounded-full border bg-contain bg-center bg-no-repeat',
            ]"
          />
          {{ choice.label }}
        </span>
        <span v-else>{{ t('select_entity', { entityName: 'market' }) }}</span>

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
            :placeholder="t('search_entity', { entityName: 'market' }) + '...'"
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
          {{ t('no_entity_found', { entityName: 'market' }) }}
        </ComboboxEmpty>

        <ComboboxGroup class="max-h-75 overflow-auto">
          <ComboboxItem v-for="item in markets" :key="item.value" :value="item">
            <div
              v-if="item.countryCode"
              :class="[
                flagClass(item.countryCode),
                'size-4.5 rounded-full border bg-contain bg-center bg-no-repeat',
              ]"
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
