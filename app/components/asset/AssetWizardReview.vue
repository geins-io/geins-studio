<script setup lang="ts">
import { mimeToAssetType } from '#shared/utils/asset';
import { formatFileSize } from '#shared/utils/file';

/**
 * Step 3 of the upload wizard — the review list. A read-only summary of every
 * file with its resolved metadata (folder, tags, channels), optionally grouped
 * by folder. Read-only — files are removed back in the manage step. Reads the
 * shared wizard state via {@link useUploadWizardContext}; the upload itself is
 * triggered from the page.
 */
const { meta } = useAssetType();
const { resolveIcon } = useLucideIcon();
const { folderName } = useFolders();
const { files, settingsOf } = useUploadWizardContext();
const { channels } = storeToRefs(useAccountStore());

const groupByFolder = ref(false);

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
const groups = computed(() => {
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

const displayGroups = computed(() =>
  groupByFolder.value ? groups.value : [{ label: null, rows: rows.value }],
);
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
          :variant="!groupByFolder ? 'default' : 'outline'"
          size="sm"
          class="gap-1.5"
          @click="groupByFolder = false"
        >
          <LucideList class="size-3.5" />
          {{ $t('asset_library.no_grouping') }}
        </Button>
        <Button
          :variant="groupByFolder ? 'default' : 'outline'"
          size="sm"
          class="gap-1.5"
          @click="groupByFolder = true"
        >
          <LucideFolder class="size-3.5" />
          {{ $t('asset_library.group_by_folder') }}
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

      <template v-for="(group, gi) in displayGroups" :key="gi">
        <div
          v-if="groupByFolder"
          class="bg-muted/40 flex items-center gap-2 border-t px-5 py-2 text-sm"
        >
          <LucideFolder class="text-muted-foreground size-3.5" />
          {{ group.label ?? $t('asset_library.no_folder') }}
          <span class="text-muted-foreground text-xs">
            {{ group.rows.length }}
          </span>
        </div>

        <div
          v-for="row in group.rows"
          :key="row.id"
          class="flex items-center gap-3 border-t px-5 py-3"
          :class="!groupByFolder && 'first:border-t-0'"
        >
          <div
            :class="[
              meta(mimeToAssetType(row.file.type)).tint,
              'flex size-8 shrink-0 items-center justify-center rounded-md',
            ]"
          >
            <component
              :is="resolveIcon(meta(mimeToAssetType(row.file.type)).icon)"
              class="size-4"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ row.name }}</p>
            <div
              class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
            >
              <span class="inline-flex items-center gap-1">
                <LucideFolder class="size-3" />
                {{
                  row.folderId
                    ? folderName(row.folderId)
                    : $t('asset_library.no_folder')
                }}
              </span>
              <span
                v-if="row.tags.length"
                class="inline-flex items-center gap-1"
              >
                <LucideTag class="size-3" />
                {{ row.tags.join(', ') }}
              </span>
              <span
                v-if="row.channelNames.length"
                class="inline-flex items-center gap-1"
              >
                <LucideGlobe class="size-3" />
                {{ row.channelNames.join(', ') }}
              </span>
            </div>
          </div>
          <span class="text-muted-foreground shrink-0 text-xs">
            {{ formatFileSize(row.file.size) }}
          </span>
          <AssetTypeBadge :type="mimeToAssetType(row.file.type)" />
        </div>
      </template>
    </div>
  </div>
</template>
