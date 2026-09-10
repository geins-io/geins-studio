<script setup lang="ts">
import type { Asset, AssetType } from '#shared/types';
import { formatFileSize } from '#shared/utils/file';

/**
 * DEV-ONLY harness for the Phase 9 asset picker (STU-339). Not linked from the
 * nav — reach it at /dev/asset-picker. Lets you open the picker in a few modes
 * and inspect what comes back. Copy is hardcoded on purpose: this page never
 * ships to production (guarded below) and must not pollute the locale files.
 */
if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    fatal: true,
  });
}

const { folderName } = useFolders();

const open = ref(false);
const multiple = ref(true);
const types = ref<AssetType[] | null>(null);
const title = ref<string | undefined>(undefined);

const chosen = ref<Asset[]>([]);
// Feed the last result back in as preselected so you can see the "linked" state
// and the new-vs-existing count behaviour on reopen.
const preselectedIds = computed(() => chosen.value.map((a) => a._id));

function openPicker(opts: {
  multiple: boolean;
  types: AssetType[] | null;
  title: string;
}) {
  multiple.value = opts.multiple;
  types.value = opts.types;
  title.value = opts.title;
  open.value = true;
}

function onConfirm(assets: Asset[]) {
  chosen.value = assets;
}

const FILE_TYPES: AssetType[] = ['pdf', 'doc', 'video', 'audio', 'svg'];
</script>

<template>
  <ContentHeader
    title="Asset picker — dev harness"
    description="Not in the nav. Opens the AssetPickerPanel (STU-339) in a few modes and shows what it returns."
  />

  <div class="flex flex-wrap gap-2">
    <Button
      @click="
        openPicker({ multiple: true, types: null, title: 'Select assets' })
      "
    >
      Pick multiple (any type)
    </Button>
    <Button
      variant="secondary"
      @click="
        openPicker({ multiple: false, types: null, title: 'Select an asset' })
      "
    >
      Pick a single asset
    </Button>
    <Button
      variant="secondary"
      @click="
        openPicker({
          multiple: true,
          types: ['image'],
          title: 'Select images',
        })
      "
    >
      Pick images only
    </Button>
    <Button
      variant="secondary"
      @click="
        openPicker({
          multiple: true,
          types: FILE_TYPES,
          title: 'Select files',
        })
      "
    >
      Pick files only
    </Button>
    <Button v-if="chosen.length" variant="outline" @click="chosen = []">
      Clear result
    </Button>
  </div>

  <div class="mt-6">
    <h2 class="mb-2 text-sm font-semibold">Chosen ({{ chosen.length }})</h2>

    <Empty v-if="!chosen.length" class="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideImage />
        </EmptyMedia>
        <EmptyTitle>Nothing chosen yet</EmptyTitle>
        <EmptyDescription>
          Open the picker with one of the buttons above and confirm a selection.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <ul v-else class="divide-y rounded-md border">
      <li
        v-for="asset in chosen"
        :key="asset._id"
        class="flex items-center gap-3 p-3"
      >
        <AssetThumbnail
          :type="asset.type"
          :thumb-url="asset.thumbUrl"
          :alt="asset.name"
          size="row"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ asset.name }}</p>
          <p class="text-muted-foreground truncate text-xs">
            {{ asset._id }} ·
            {{ folderName(asset.folderId) ?? 'uncategorised' }}
          </p>
        </div>
        <AssetTypeBadge :type="asset.type" />
        <span class="text-muted-foreground w-20 text-right text-xs">
          {{ formatFileSize(asset.sizeBytes) }}
        </span>
      </li>
    </ul>

    <details v-if="chosen.length" class="mt-4">
      <summary class="text-muted-foreground cursor-pointer text-xs">
        Raw payload
      </summary>
      <pre class="bg-muted mt-2 overflow-auto rounded-md p-3 text-xs">{{
        JSON.stringify(chosen, null, 2)
      }}</pre>
    </details>
  </div>

  <AssetPickerPanel
    v-model:open="open"
    :multiple="multiple"
    :types="types"
    :title="title"
    :preselected-ids="preselectedIds"
    @confirm="onConfirm"
  />
</template>
