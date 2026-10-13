<script setup lang="ts">
import { ListboxFilter, useFilter } from 'reka-ui';
import type { SelectorEntity } from '#shared/types';
import {
  applyProductRefPaste,
  type ProductRefPasteMode,
} from '#shared/utils/asset';

/**
 * Product multi-select in three parts: "Add by search" (matches open in a
 * popover), "Add by pasting ids" (a ref list, added to or replacing the
 * selection), and a list of the selected products with a remove button each.
 * `lockedIds` show in the search results disabled, with `lockedLabel` — e.g.
 * products an asset is already linked to. `loading` disables paste and shows
 * skeleton results while the caller's product list loads.
 */
const props = withDefaults(
  defineProps<{
    products: SelectorEntity[];
    lockedIds?: string[];
    lockedLabel?: string;
    /** The product list is still loading. */
    loading?: boolean;
  }>(),
  { lockedIds: () => [], lockedLabel: undefined },
);
const selected = defineModel<string[]>({ default: () => [] });

const { t } = useI18n();
const { contains } = useFilter({ sensitivity: 'base' });
const searchInputId = useId();
const pasteInputId = useId();

// Rendering a whole catalogue of rows is slow; past this the user narrows.
const MAX_VISIBLE = 100;

// Own search state rather than `CommandInput`: `CommandItem` clears the
// command's search on every select, which would reset it after each toggle.
const search = ref('');
const matches = computed(() => {
  const term = search.value.trim();
  if (!term) return [];
  return props.products.filter((p) =>
    [p.name, p.articleNumber, p._id].some(
      (v) => v && contains(String(v), term),
    ),
  );
});
const visible = computed(() => matches.value.slice(0, MAX_VISIBLE));

const resultsOpen = ref(false);
watch(search, (term) => {
  resultsOpen.value = !!term.trim();
});
const searchAnchor = useTemplateRef<HTMLElement>('searchAnchor');
// The search field sits outside the popover; typing or clicking in it must not
// dismiss the results.
function keepOpenOnSearch(event: Event) {
  if (searchAnchor.value?.contains(event.target as Node))
    event.preventDefault();
}

const locked = computed(() => new Set(props.lockedIds));
const selectedSet = computed(() => new Set(selected.value));

// Prevented so the listbox doesn't keep its own selection — the model is the
// single source.
function toggle(event: Event, id: string) {
  event.preventDefault();
  if (locked.value.has(id)) return;
  selected.value = selectedSet.value.has(id)
    ? selected.value.filter((s) => s !== id)
    : [...selected.value, id];
}

function remove(id: string) {
  selected.value = selected.value.filter((s) => s !== id);
}

const productById = computed(
  () => new Map(props.products.map((p) => [p._id, p])),
);
const selectedProducts = computed(() =>
  selected.value.map(
    (id): SelectorEntity => productById.value.get(id) ?? { _id: id, name: id },
  ),
);

const refs = (product: SelectorEntity) =>
  [product.articleNumber, product._id].filter(Boolean).join(' · ');

const { matchById } = useProductMatch();
const PASTE_MODES: ProductRefPasteMode[] = ['add', 'replace'];
const pasteText = ref('');
const pasteMode = ref<ProductRefPasteMode>('add');
const notFound = ref<string[]>([]);

// A single-line input flattens or drops the line breaks of a pasted column
// (e.g. from a spreadsheet); keep them as separators.
function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text');
  if (!text || !/[\r\n]/.test(text)) return;
  event.preventDefault();
  const input = event.target as HTMLInputElement;
  const start = input.selectionStart ?? pasteText.value.length;
  const end = input.selectionEnd ?? start;
  const flat = text
    .trim()
    .split(/\s*[\r\n]+\s*/)
    .join(', ');
  pasteText.value =
    pasteText.value.slice(0, start) + flat + pasteText.value.slice(end);
}

function applyPaste() {
  if (props.loading || !pasteText.value.trim()) return;
  const result = applyProductRefPaste(pasteText.value, {
    current: selected.value,
    lockedIds: props.lockedIds,
    mode: pasteMode.value,
    resolve: (ref) => matchById(ref)?._id ?? null,
  });
  selected.value = result.selected;
  notFound.value = result.notFound;
  pasteText.value = '';
}
</script>

<template>
  <div class="flex flex-col gap-4 *:shrink-0">
    <!-- Children never shrink: in a height-constrained parent (the bulk pane)
         the selected list was squeezed to one row. -->
    <Command
      multiple
      :model-value="selected"
      class="h-auto gap-2 overflow-visible bg-transparent"
    >
      <Label :for="searchInputId">{{ t('add_products_by_search') }}</Label>
      <Popover
        :open="resultsOpen"
        @update:open="(open: boolean) => (resultsOpen = open)"
      >
        <!-- Input look, same height as the paste input group; `ListboxFilter`
             keeps the arrow keys moving into the results. -->
        <PopoverAnchor as-child>
          <div
            ref="searchAnchor"
            class="bg-input focus-within:border-primary relative h-10 w-full rounded-lg border pl-8"
          >
            <ListboxFilter
              :id="searchInputId"
              v-model="search"
              auto-focus
              :placeholder="t('search_products_placeholder')"
              class="bg-input placeholder:text-muted-foreground flex h-full w-full rounded-lg px-2 py-1 text-sm outline-hidden sm:px-3"
              data-test="product-multi-select-search"
              @focus="resultsOpen = !!search.trim()"
            />
            <span
              class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
            >
              <LucideSearch class="text-foreground size-4" aria-hidden="true" />
            </span>
          </div>
        </PopoverAnchor>
        <!-- Focus stays in the search field, so typing keeps filtering. -->
        <PopoverContent
          align="start"
          class="w-(--reka-popper-anchor-width) p-0"
          @open-auto-focus.prevent
          @close-auto-focus.prevent
          @interact-outside="keepOpenOnSearch"
        >
          <div v-if="loading" class="space-y-1 p-2">
            <div
              v-for="i in 3"
              :key="i"
              class="flex items-center gap-3 px-2 py-1.5"
            >
              <Skeleton class="size-6 rounded-md" />
              <Skeleton class="h-4 w-40" />
            </div>
          </div>
          <p
            v-else-if="!visible.length"
            class="text-muted-foreground px-3 py-6 text-center text-sm"
          >
            {{ t('no_entity_found', { entityKey: 'product' }, 2) }}
          </p>
          <CommandList v-else class="max-h-72 p-2">
            <CommandGroup>
              <CommandItem
                v-for="product in visible"
                :key="product._id"
                :value="product._id"
                :disabled="locked.has(product._id)"
                class="cursor-pointer gap-3 border-t-0 px-2 py-1.5"
                data-test="product-multi-select-result"
                @select="(event) => toggle(event, product._id)"
              >
                <ProductThumbnail
                  :src="product.thumbnail"
                  :alt="product.name"
                  class="size-6"
                />
                <span class="min-w-0 flex-1 truncate">
                  <span class="text-foreground font-medium">
                    {{ product.name }}
                  </span>
                  <span v-if="refs(product)" class="text-muted-foreground">
                    {{ ' ' }}· {{ refs(product) }}
                  </span>
                </span>
                <Badge
                  v-if="lockedLabel && locked.has(product._id)"
                  variant="secondary"
                  size="sm"
                >
                  {{ lockedLabel }}
                </Badge>
                <LucideCircleCheck
                  v-else-if="
                    selectedSet.has(product._id) || locked.has(product._id)
                  "
                  class="text-positive size-4 shrink-0"
                />
                <LucideCirclePlus v-else class="size-4 shrink-0" />
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <p
            v-if="matches.length > MAX_VISIBLE"
            class="text-muted-foreground border-t px-3 py-2 text-xs"
          >
            {{ t('showing_first_search_to_narrow', { count: MAX_VISIBLE }) }}
          </p>
        </PopoverContent>
      </Popover>
    </Command>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between gap-3">
        <Label :for="pasteInputId">{{ t('add_products_by_paste') }}</Label>
        <ButtonGroup>
          <Button
            v-for="mode in PASTE_MODES"
            :key="mode"
            variant="outline"
            size="xs"
            :class="segmentedButtonClass(pasteMode === mode)"
            :aria-pressed="pasteMode === mode"
            :data-test="`product-multi-select-paste-${mode}`"
            @click="pasteMode = mode"
          >
            {{ t(mode) }}
          </Button>
        </ButtonGroup>
      </div>
      <InputGroup>
        <InputGroupInput
          :id="pasteInputId"
          v-model="pasteText"
          :placeholder="t('paste_product_refs_placeholder')"
          data-test="product-multi-select-paste"
          @paste="onPaste"
          @keydown.enter.prevent="applyPaste"
        />
        <InputGroupAddon align="inline-end">
          <!-- The addon mutes its text; the button keeps the normal color. -->
          <InputGroupButton
            variant="outline"
            size="sm"
            class="text-foreground h-7 rounded-lg px-2"
            :disabled="loading || !pasteText.trim()"
            data-test="product-multi-select-paste-apply"
            @click="applyPaste"
          >
            {{ t('select') }}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p class="text-muted-foreground text-xs">
        {{ t('paste_product_refs_description') }}
      </p>
      <p
        v-if="notFound.length"
        class="text-destructive text-xs"
        data-test="product-multi-select-not-found"
      >
        {{
          t('count_not_found', {
            count: notFound.length,
            refs: notFound.join(', '),
          })
        }}
      </p>
    </div>

    <p
      v-if="!selectedProducts.length"
      class="text-muted-foreground rounded-lg border px-3 py-6 text-center text-sm"
    >
      {{ t('no_entity_selected', { entityKey: 'product' }, 2) }}
    </p>
    <ul v-else class="max-h-52 overflow-y-auto rounded-lg border px-2 py-2">
      <li
        v-for="product in selectedProducts"
        :key="product._id"
        class="flex items-center gap-3 rounded-md px-2 py-1 text-sm"
        data-test="product-multi-select-row"
      >
        <ProductThumbnail
          :src="product.thumbnail"
          :alt="product.name"
          class="size-6"
        />
        <span class="min-w-0 flex-1 truncate">
          <span class="text-foreground font-medium">{{ product.name }}</span>
          <span v-if="refs(product)" class="text-muted-foreground">
            {{ ' ' }}· {{ refs(product) }}
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 shrink-0"
          :aria-label="t('remove_entity', { entityKey: 'product' })"
          data-test="product-multi-select-remove"
          @click="remove(product._id)"
        >
          <LucideX class="size-4" />
        </Button>
      </li>
    </ul>
  </div>
</template>
