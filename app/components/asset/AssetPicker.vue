<script setup lang="ts">
import type { Asset, AssetType } from '#shared/types';

/**
 * Declarative sugar over [useAssetPicker](/composables/useAssetPicker): wrap any
 * button / field / item to turn it into a picker trigger. Props mirror
 * `AssetPickerOptions`; the chosen assets flow back through `v-model` and the
 * `confirm` emit.
 *
 * Two trigger styles, both supported at once:
 *  - Auto-bind: `<AssetPicker><Button>Pick</Button></AssetPicker>` — a click on
 *    the wrapped child opens the picker (the wrapper catches the bubbled click).
 *  - Custom wiring: `<AssetPicker v-slot="{ open }"><Button @click="open" />` —
 *    the slot exposes `{ open, isOpen }`. Wiring `@click` here is harmless
 *    alongside auto-bind: the second `open()` call is ignored while open.
 *
 * `preselectedIds` defaults to the current `v-model` ids, so a re-open shows the
 * existing selection as "linked". Cancel/close resolves `[]` and leaves the
 * model untouched.
 */
const props = withDefaults(
  defineProps<{
    multiple?: boolean;
    types?: AssetType[] | null;
    preselectedIds?: string[];
    title?: string;
    folderId?: string | null;
  }>(),
  {
    multiple: true,
    types: null,
    preselectedIds: undefined,
    title: undefined,
    folderId: null,
  },
);

const emit = defineEmits<{
  confirm: [assets: Asset[]];
}>();

const model = defineModel<Asset[]>({ default: () => [] });

const { open: openPicker, isOpen } = useAssetPicker();

async function open() {
  const assets = await openPicker({
    multiple: props.multiple,
    types: props.types,
    preselectedIds: props.preselectedIds ?? model.value.map((a) => a._id),
    title: props.title,
    folderId: props.folderId,
  });
  // Cancel/close resolves [] — leave the current selection untouched.
  if (assets.length === 0) return;
  model.value = assets;
  emit('confirm', assets);
}
</script>

<template>
  <div class="contents" @click="open">
    <slot :open="open" :is-open="isOpen" />
  </div>
</template>
