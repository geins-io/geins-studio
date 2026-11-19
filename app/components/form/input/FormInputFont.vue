<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { ComboboxPortal } from 'reka-ui';
import type { StorefrontFont } from '@/utils/storefrontFonts';

const MAX_CATALOGUE_RESULTS = 30;

const model = defineModel<string>();

const { geinsLogError } = useGeinsLog(
  'components/form/input/FormInputFont.vue',
);

const curatedValues = new Set(storefrontFonts.map((f) => f.value));

// Google Fonts catalogue minus the curated suggestions, so no font is listed twice.
const catalogue = shallowRef<StorefrontFont[]>([]);
const catalogueLoading = ref(false);
const catalogueByValue = computed(
  () => new Map(catalogue.value.map((f) => [f.value, f])),
);

async function ensureCatalogue() {
  if (catalogue.value.length || catalogueLoading.value) return;
  catalogueLoading.value = true;
  try {
    const fonts = await loadGoogleFonts();
    catalogue.value = fonts.filter((f) => !curatedValues.has(f.value));
  } catch (error) {
    geinsLogError('failed to load the Google Fonts catalogue', error);
  } finally {
    catalogueLoading.value = false;
  }
}

// A stored family found in neither list still shows, in a fallback face.
function resolveFont(value: string | undefined): StorefrontFont | undefined {
  if (!value) return undefined;
  return (
    storefrontFonts.find((f) => f.value === value) ??
    catalogueByValue.value.get(value) ?? {
      label: value,
      value,
      category: 'sans-serif',
    }
  );
}

const choice = ref<StorefrontFont | undefined>(resolveFont(model.value));

const searchTerm = ref('');
const debouncedSearchTerm = refDebounced(searchTerm, 150);
const isSearching = computed(() => searchTerm.value.trim() !== '');

const suggestions = computed(() =>
  isSearching.value
    ? searchFonts(storefrontFonts, searchTerm.value)
    : storefrontFonts,
);
const catalogueResults = computed(() =>
  searchFonts(
    catalogue.value,
    debouncedSearchTerm.value,
    MAX_CATALOGUE_RESULTS,
  ),
);

// Only ever adds stylesheets: swapping one out would drop faces already on screen.
const previewHrefs = ref<string[]>([]);
const previewed = new Set(curatedValues);

function loadPreviews(fonts: StorefrontFont[]) {
  const fresh = fonts.map((f) => f.value).filter((v) => !previewed.has(v));
  fresh.forEach((v) => previewed.add(v));
  const href = fontPreviewCssUrl(fresh);
  if (href) previewHrefs.value = [...previewHrefs.value, href];
}

useHead({
  link: computed(() =>
    [storefrontFontsCssUrl, ...previewHrefs.value].map((href) => ({
      rel: 'stylesheet',
      href,
    })),
  ),
});

watch(catalogueResults, loadPreviews);

watch(
  choice,
  (font) => {
    if (font && catalogueByValue.value.has(font.value)) loadPreviews([font]);
  },
  { immediate: true },
);

watch(catalogue, () => {
  if (choice.value) choice.value = resolveFont(choice.value.value);
});

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLElement | null>(null);
const comboboxList = ref<HTMLElement | null>(null);
const isComingFromSearchInput = ref(false);
const wasOpenBeforeClick = ref(false);

watch(open, (isOpen) => {
  if (isOpen) ensureCatalogue();
});

onMounted(() => {
  if (model.value && !curatedValues.has(model.value)) ensureCatalogue();
});

watch(choice, (newChoice) => {
  if (newChoice?.value === model.value) return;
  model.value = newChoice?.value ?? '';
  open.value = false;
  isComingFromSearchInput.value = true;
  setTimeout(() => trigger.value?.focus(), 0);
});

watch(model, (newVal) => {
  if (choice.value?.value !== newVal) {
    choice.value = resolveFont(newVal);
  }
  if (newVal && !curatedValues.has(newVal)) ensureCatalogue();
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
  }
};

const handleSearchTab = (event: KeyboardEvent) => {
  event.preventDefault();
  isComingFromSearchInput.value = true;
  open.value = false;
  setTimeout(() => trigger.value?.focus(), 0);
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
  <Combobox
    v-model="choice"
    v-model:open="open"
    by="value"
    ignore-filter
    class="relative"
  >
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
        <span v-else class="text-muted-foreground">
          {{ $t('select_entity', { entityKey: 'font' }) }}
        </span>

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
            v-model="searchTerm"
            class="focus:border-primary focus-visible:border-primary h-10 rounded-none border-0 border-b pl-9 focus:rounded-lg focus:border focus-visible:ring-0 focus-visible:outline-hidden"
            :placeholder="$t('search_entity', { entityKey: 'font' }, 2)"
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

        <ComboboxEmpty
          v-if="!catalogueLoading && searchTerm === debouncedSearchTerm"
        >
          {{ $t('no_entity_found', { entityKey: 'font' }, 2) }}
        </ComboboxEmpty>

        <div class="max-h-75 overflow-auto">
          <ComboboxGroup
            v-if="suggestions.length"
            :heading="$t('font_suggestions')"
          >
            <ComboboxItem
              v-for="font in suggestions"
              :key="font.value"
              :value="font"
            >
              <span :style="fontStyle(font)">{{ font.label }}</span>

              <ComboboxItemIndicator>
                <LucideCheck class="ml-auto size-4" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxGroup>

          <ComboboxGroup
            v-if="isSearching && catalogueResults.length"
            :heading="$t('font_all_google_fonts')"
          >
            <ComboboxItem
              v-for="font in catalogueResults"
              :key="font.value"
              :value="font"
            >
              <span :style="fontStyle(font)">{{ font.label }}</span>

              <ComboboxItemIndicator>
                <LucideCheck class="ml-auto size-4" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxGroup>

          <p
            v-if="isSearching && catalogueLoading"
            class="text-muted-foreground px-3 py-2 text-sm"
          >
            {{ $t('loading') }}
          </p>
        </div>
      </ComboboxList>
    </ComboboxPortal>
  </Combobox>
</template>
