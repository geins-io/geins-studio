<script setup lang="ts">
import type { ProductMatch } from '#shared/types';
import { parseProductRef } from '#shared/utils/asset';

/**
 * Step 3 of the upload wizard — the review list. A read-only summary of every
 * file with its resolved metadata (folder, tags, channels), viewable flat,
 * grouped by folder, or grouped by the product each image links to. Read-only —
 * files are removed back in the manage step. Reads the shared wizard state via
 * {@link useUploadWizardContext}; the upload itself is triggered from the page.
 */
const { resolveIcon } = useLucideIcon();
const { folderName } = useFolders();
const { files, settingsOf, linkProducts } = useUploadWizardContext();
const { channels } = storeToRefs(useAccountStore());
const { matchOf } = useProductMatch();

type ReviewView = 'list' | 'folder' | 'matched';
const view = ref<ReviewView>('list');

interface ReviewRow {
  id: string;
  file: File;
  name: string;
  folderId: string | null;
  tags: string[];
  channelNames: string[];
}

const channelName = (id: string): string =>
  channels.value.find((c) => c._id === id)?.name ?? id;

const rows = computed<ReviewRow[]>(() =>
  files.value.map((f) => {
    const s = settingsOf(f.id);
    return {
      id: f.id,
      file: f.file,
      name: s.name || f.file.name,
      folderId: s.folderId ?? null,
      tags: s.tags ?? [],
      channelNames: (s.channels ?? []).map(channelName),
    };
  }),
);

// Grouped by folder, with the "no folder" group sorted last.
const folderGroups = computed(() => {
  const map = new Map<string | null, ReviewRow[]>();
  for (const row of rows.value) {
    const list = map.get(row.folderId) ?? [];
    list.push(row);
    map.set(row.folderId, list);
  }
  return [...map.entries()]
    .map(([folderId, list]) => ({
      label: folderId ? (folderName(folderId) ?? '') : null,
      rows: list,
    }))
    .sort((a, b) =>
      a.label === null
        ? 1
        : b.label === null
          ? -1
          : a.label.localeCompare(b.label),
    );
});

// ── Product-linking view ──────────────────────────────────────────────────────
// Grouped by the product each row's image links to (by _id OR article number);
// unmatched rows fall into a "No match" group listed last. Group identity is the
// product _id; the header shows the ref the filename actually linked by (so an
// id-matched file reads as its id, not the product's article number) + name.
const NO_MATCH = '__nomatch__';

const matchedCount = computed(
  () => rows.value.filter((r) => matchOf(r.file)).length,
);
const unmatchedCount = computed(() => rows.value.length - matchedCount.value);

const matchedGroups = computed(() => {
  const map = new Map<
    string,
    {
      product: ProductMatch | null;
      matchedRef: string | null;
      rows: ReviewRow[];
    }
  >();
  for (const row of rows.value) {
    const product = matchOf(row.file);
    const key = product ? product._id : NO_MATCH;
    const group = map.get(key) ?? {
      product,
      matchedRef: product ? parseProductRef(row.file.name) : null,
      rows: [],
    };
    group.rows.push(row);
    map.set(key, group);
  }
  return [...map.entries()]
    .map(([key, group]) => ({ key, ...group }))
    .sort((a, b) =>
      a.key === NO_MATCH
        ? 1
        : b.key === NO_MATCH
          ? -1
          : a.key.localeCompare(b.key),
    );
});

// Folder + product groups share one row-list shape so the grouped template
// renders either without union narrowing. `label` is the header text (folder
// name, or the matched ref); `productName` and `noMatch` are product-view only.
interface DisplayGroup {
  id: string;
  kind: 'folder' | 'product';
  label: string | null;
  productName: string | null;
  noMatch: boolean;
  rows: ReviewRow[];
}
const displayGroups = computed<DisplayGroup[]>(() =>
  view.value === 'folder'
    ? folderGroups.value.map((g, i) => ({
        id: `folder-${i}`,
        kind: 'folder',
        label: g.label,
        productName: null,
        noMatch: false,
        rows: g.rows,
      }))
    : matchedGroups.value.map((g) => ({
        id: g.key,
        kind: 'product',
        label: g.matchedRef,
        productName: g.product?.name ?? null,
        noMatch: g.key === NO_MATCH,
        rows: g.rows,
      })),
);

const viewOptions: { value: ReviewView; icon: string; labelKey: string }[] = [
  { value: 'list', icon: 'List', labelKey: 'asset_library.no_grouping' },
  {
    value: 'folder',
    icon: 'Folder',
    labelKey: 'asset_library.group_by_folder',
  },
  {
    value: 'matched',
    icon: 'Link2',
    labelKey: 'asset_library.group_by_product',
  },
];
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <span class="text-muted-foreground text-sm">
        {{
          $t('asset_library.files_total', { count: rows.length }, rows.length)
        }}
      </span>
      <div class="flex-1" />
      <ButtonGroup>
        <Button
          v-for="opt in viewOptions"
          :key="opt.value"
          :variant="view === opt.value ? 'default' : 'outline'"
          size="sm"
          class="gap-1.5"
          @click="view = opt.value"
        >
          <component :is="resolveIcon(opt.icon)" class="size-3.5" />
          {{ $t(opt.labelKey) }}
        </Button>
      </ButtonGroup>
    </div>

    <div class="overflow-hidden rounded-lg border">
      <div
        class="bg-muted/40 text-muted-foreground flex items-center px-5 py-2.5 text-xs font-medium tracking-wider uppercase"
      >
        <span class="flex-1">{{ $t('name', 1) }}</span>
        <span>{{ $t('type') }}</span>
      </div>

      <!-- Match summary bar (product view only) -->
      <div
        v-if="view === 'matched' && linkProducts"
        class="bg-muted/20 text-muted-foreground flex items-center gap-2 border-t px-5 py-2 text-xs"
      >
        <span>
          <span class="text-foreground font-medium">{{ matchedCount }}</span>
          {{ $t('asset_library.match_matched') }}
        </span>
        <span class="text-muted-foreground/50">·</span>
        <span>
          <span class="text-foreground font-medium">{{ unmatchedCount }}</span>
          {{ $t('asset_library.match_unmatched') }}
        </span>
      </div>

      <!-- Linking-off hint (product view, auto-link disabled) -->
      <Empty v-if="view === 'matched' && !linkProducts" class="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideLink2 />
          </EmptyMedia>
          <EmptyDescription>
            {{ $t('asset_library.linking_off_hint') }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <!-- Grouped views (folder / product) -->
      <template v-else-if="view !== 'list'">
        <template v-for="group in displayGroups" :key="group.id">
          <div
            class="bg-muted/40 flex items-center gap-2 border-t px-5 py-2 text-sm"
          >
            <template v-if="group.kind === 'folder'">
              <LucideFolder class="text-muted-foreground size-3.5" />
              {{ group.label ?? $t('asset_library.no_folder') }}
            </template>
            <template v-else-if="!group.noMatch">
              <LucideLink2 class="text-muted-foreground size-3.5" />
              <span>{{ group.label }}</span>
              <span
                v-if="group.productName"
                class="text-muted-foreground text-xs"
              >
                {{ group.productName }}
              </span>
            </template>
            <template v-else>
              <LucideLink2 class="text-muted-foreground size-3.5" />
              {{ $t('asset_library.no_match') }}
            </template>
            <span class="text-muted-foreground text-xs">
              {{ group.rows.length }}
            </span>
          </div>
          <AssetReviewRow
            v-for="row in group.rows"
            :key="row.id"
            :name="row.name"
            :file="row.file"
            :folder-name="row.folderId ? folderName(row.folderId) : undefined"
            :tags="row.tags"
            :channel-names="row.channelNames"
          />
        </template>
      </template>

      <!-- Flat list -->
      <template v-else>
        <AssetReviewRow
          v-for="row in rows"
          :key="row.id"
          class="first:border-t-0"
          :name="row.name"
          :file="row.file"
          :folder-name="row.folderId ? folderName(row.folderId) : undefined"
          :tags="row.tags"
          :channel-names="row.channelNames"
        />
      </template>
    </div>
  </div>
</template>
