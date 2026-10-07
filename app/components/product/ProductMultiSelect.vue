<script setup lang="ts">
import { ListboxFilter, useFilter } from 'reka-ui';
import type { SelectorEntity } from '#shared/types';

/**
 * Searchable, always-open multi-select over a product list: a search field and
 * a checkbox row per product (thumbnail, name, article number · id). Renders
 * inline (no popover), so it works inside a sheet or dialog without fighting
 * their focus trap. `lockedIds` render checked and disabled with `lockedLabel`
 * — e.g. products an asset is already linked to. `loading` shows skeleton
 * rows while the caller's product list loads.
 */
const props = withDefaults(
  defineProps<{
    products: SelectorEntity[];
    lockedIds?: string[];
    lockedLabel?: string;
    /** The product list is still loading — rows render as skeletons. */
    loading?: boolean;
  }>(),
  { lockedIds: () => [], lockedLabel: undefined },
);
const selected = defineModel<string[]>({ default: () => [] });

const { t } = useI18n();
const { contains } = useFilter({ sensitivity: 'base' });

// Rendering a whole catalogue of rows is slow; past this the user searches.
const MAX_VISIBLE = 100;

// Own search state rather than `CommandInput`: `CommandItem` clears the
// command's search on every select, which would reset it after each toggle.
const search = ref('');
const matches = computed(() => {
  const term = search.value.trim();
  if (!term) return props.products;
  return props.products.filter((p) =>
    [p.name, p.articleNumber, p._id].some(
      (v) => v && contains(String(v), term),
    ),
  );
});
const visible = computed(() => matches.value.slice(0, MAX_VISIBLE));

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

const refs = (product: SelectorEntity) =>
  [product.articleNumber, product._id].filter(Boolean).join(' · ');
</script>

<template>
  <Command multiple :model-value="selected" class="rounded-lg border">
    <div class="border-b px-3 pt-3 pb-2">
      <!-- Same look as an `Input size="md"` search; `ListboxFilter` keeps the
           arrow keys moving into the options. -->
      <div
        class="bg-input focus-within:border-primary relative h-9 w-full rounded-lg border pl-8"
      >
        <ListboxFilter
          v-model="search"
          auto-focus
          :placeholder="t('global_search_placeholder')"
          class="bg-input placeholder:text-muted-foreground flex h-full w-full rounded-lg px-2 py-1 text-sm outline-hidden sm:px-3"
        />
        <span
          class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
        >
          <LucideSearch class="text-foreground size-4" aria-hidden="true" />
        </span>
      </div>
    </div>

    <div v-if="loading" class="space-y-1 px-3 py-2">
      <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-1 py-1.5">
        <Skeleton class="size-4 rounded-sm" />
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
    <CommandList v-else class="max-h-72 px-2 py-2">
      <CommandGroup>
        <CommandItem
          v-for="product in visible"
          :key="product._id"
          :value="product._id"
          :disabled="locked.has(product._id)"
          class="cursor-pointer gap-3 border-t-0 px-2 py-1.5"
          data-test="product-multi-select-row"
          @select="(event) => toggle(event, product._id)"
        >
          <Checkbox
            :model-value="
              locked.has(product._id) || selectedSet.has(product._id)
            "
            :disabled="locked.has(product._id)"
            tabindex="-1"
            aria-hidden="true"
            class="pointer-events-none"
          />
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
          <Badge
            v-if="lockedLabel && locked.has(product._id)"
            variant="secondary"
            size="sm"
          >
            {{ lockedLabel }}
          </Badge>
        </CommandItem>
      </CommandGroup>
    </CommandList>
    <p
      v-if="matches.length > MAX_VISIBLE"
      class="text-muted-foreground border-t px-3 py-2 text-xs"
    >
      {{ t('showing_first_search_to_narrow', { count: MAX_VISIBLE }) }}
    </p>
  </Command>
</template>
