<script setup lang="ts">
import { ComboboxPortal } from 'reka-ui';
import {
  storefrontFonts,
  storefrontFontsCssUrl,
  fontFallback,
  type StorefrontFont,
} from '@/utils/storefrontFonts';

const model = defineModel<string>();

// Lazy-load font preview CSS when component mounts
useHead({
  link: [{ rel: 'stylesheet', href: storefrontFontsCssUrl }],
});

const choice = ref<StorefrontFont | undefined>(
  storefrontFonts.find((f) => f.value === model.value),
);

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);
const comboboxList = ref<HTMLElement | null>(null);
const isComingFromSearchInput = ref(false);
const wasOpenBeforeClick = ref(false);

watch(choice, (newChoice) => {
  if (newChoice?.value === model.value) return;
  model.value = newChoice?.value ?? '';
  open.value = false;
});

watch(model, (newVal) => {
  if (choice.value?.value !== newVal) {
    choice.value = storefrontFonts.find((f) => f.value === newVal);
  }
});

function fontStyle(font: StorefrontFont) {
  return { fontFamily: `'${font.value}', ${fontFallback(font.category)}` };
}

const handleFocus = (event: FocusEvent) => {
  if (isComingFromSearchInput.value) {
    isComingFromSearchInput.value = false;
    return;
  }
  if (event.relatedTarget && event.relatedTarget === event.currentTarget)
    return;
  if (!wasOpenBeforeClick.value) open.value = true;
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
    setTimeout(() => trigger.value?.focus(), 0);
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
  <Combobox v-model="choice" v-model:open="open" by="value" class="relative">
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
        <span v-if="choice" :style="fontStyle(choice)">
          {{ choice.label }}
        </span>
        <span v-else class="text-muted-foreground">Select font...</span>

        <LucideChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
      </button>
    </ComboboxAnchor>

    <ComboboxPortal to="body">
      <ComboboxList
        ref="comboboxList"
        position="popper"
        class="relative w-(--reka-popper-anchor-width)"
      >
        <div
          class="bg-card sticky top-0 z-50 w-full items-center rounded-t border-b"
        >
          <ComboboxInput
            ref="searchInput"
            class="focus:border-primary focus-visible:border-primary h-10 rounded-none border-0 border-b pl-9 focus:rounded-lg focus:border focus-visible:ring-0 focus-visible:outline-hidden"
            placeholder="Search fonts..."
            autocomplete="off"
            @blur="handleBlur"
          />
          <span
            class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
          >
            <LucideSearch class="text-muted-foreground size-4" />
          </span>
        </div>

        <ComboboxEmpty> No fonts found </ComboboxEmpty>

        <ComboboxGroup class="max-h-75 overflow-auto">
          <ComboboxItem
            v-for="font in storefrontFonts"
            :key="font.value"
            :value="font"
          >
            <span :style="fontStyle(font)">{{ font.label }}</span>

            <ComboboxItemIndicator>
              <LucideCheck class="ml-auto size-4" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </ComboboxPortal>
  </Combobox>
</template>
