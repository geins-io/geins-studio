<script setup lang="ts">
import type { Asset, AssetType } from '#shared/types';
import { formatFileSize } from '#shared/utils/file';

/**
 * DEV-ONLY harness for the Phase 9 asset picker. Not linked from the nav —
 * reach it at /dev/asset-picker. Exercises the imperative service
 * (`useAssetPicker`) and the `<AssetPicker>` wrapper against the single global
 * host. Copy is hardcoded on purpose: this page never ships to production
 * (guarded below) and must not pollute the locale files.
 */
if (!import.meta.dev) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
    fatal: true,
  });
}

const { folderName } = useFolders();
const { open: openPicker } = useAssetPicker();

const chosen = ref<Asset[]>([]);
// Feed the last result back in as preselected so you can see the "linked" state
// and the new-vs-existing count behaviour on reopen.
const preselectedIds = computed(() => chosen.value.map((a) => a._id));

async function openMode(opts: {
  multiple: boolean;
  types: AssetType[] | null;
  title: string;
}) {
  const assets = await openPicker({
    multiple: opts.multiple,
    types: opts.types,
    title: opts.title,
    preselectedIds: preselectedIds.value,
  });
  // Cancel resolves [] — keep the previous result.
  if (assets.length) chosen.value = assets;
}

const FILE_TYPES: AssetType[] = ['pdf', 'doc', 'video', 'audio', 'svg'];
</script>

<template>
  <ContentHeader
    title="Asset picker — dev harness"
    description="Not in the nav. Drives the global AssetPickerHost via useAssetPicker + the <AssetPicker> wrapper."
  />

  <div class="flex flex-wrap gap-2">
    <Button
      @click="openMode({ multiple: true, types: null, title: 'Select assets' })"
    >
      Pick multiple (any type)
    </Button>
    <Button
      variant="secondary"
      @click="
        openMode({ multiple: false, types: null, title: 'Select an asset' })
      "
    >
      Pick a single asset
    </Button>
    <Button
      variant="secondary"
      @click="
        openMode({ multiple: true, types: ['image'], title: 'Select images' })
      "
    >
      Pick images only
    </Button>
    <Button
      variant="secondary"
      @click="
        openMode({ multiple: true, types: FILE_TYPES, title: 'Select files' })
      "
    >
      Pick files only
    </Button>

    <!-- Wrapper path: v-model + auto-bind click on the wrapped child. -->
    <AssetPicker
      v-model="chosen"
      :types="['image']"
      title="Select images (wrapper)"
    >
      <Button variant="outline">Wrapper (images, v-model)</Button>
    </AssetPicker>

    <Button v-if="chosen.length" variant="ghost" @click="chosen = []">
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
</template>
