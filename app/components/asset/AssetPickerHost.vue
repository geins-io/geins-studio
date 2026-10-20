<script setup lang="ts">
import type { Asset } from '#shared/types';

/**
 * Single app-wide instance of [AssetPickerPanel](/components/asset/AssetPickerPanel),
 * bound to the shared state from [useAssetPicker](/composables/useAssetPicker).
 * Mounted once in `app.vue`; consumers open it imperatively via `useAssetPicker`
 * or declaratively via [AssetPicker](/components/asset/AssetPicker) — never place
 * this component directly on a page.
 */
const { isOpen, options, confirm, cancel } = useAssetPicker();

function onOpenChange(value: boolean) {
  if (!value) cancel();
}

function onConfirm(assets: Asset[]) {
  confirm(assets);
}
</script>

<template>
  <AssetPickerPanel
    :open="isOpen"
    :multiple="options.multiple"
    :types="options.types ?? null"
    :preselected-ids="options.preselectedIds"
    :title="options.title"
    :folder-id="options.folderId ?? null"
    @update:open="onOpenChange"
    @confirm="onConfirm"
  />
</template>
