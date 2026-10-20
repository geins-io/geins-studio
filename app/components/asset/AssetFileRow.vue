<script setup lang="ts">
import { mimeToAssetType } from '#shared/utils/asset';
import { formatFileSize } from '#shared/utils/file';

/**
 * Selected-file row for the upload / replace dialogs: a type-tinted icon (from
 * the file's mime via {@link useAssetType}), the file name, its size, and a
 * remove button. Operates on a native `File` (pre-upload), so it takes the file
 * directly rather than an {@link Asset}.
 */
const props = defineProps<{ file: File }>();
const emit = defineEmits<{ remove: [] }>();

const { meta } = useAssetType();
const { resolveIcon } = useLucideIcon();

const info = computed(() => meta(mimeToAssetType(props.file.type)));
const icon = computed(() => resolveIcon(info.value.icon));
</script>

<template>
  <div class="bg-muted/40 flex items-center gap-3 rounded-lg px-3 py-2.5">
    <div
      :class="[
        info.tint,
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
      ]"
    >
      <component :is="icon" class="size-5" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="truncate text-sm font-semibold">{{ file.name }}</div>
      <div class="text-muted-foreground text-xs">
        {{ formatFileSize(file.size) }}
      </div>
    </div>
    <button
      type="button"
      class="text-muted-foreground hover:text-foreground shrink-0"
      :aria-label="$t('remove')"
      @click="emit('remove')"
    >
      <LucideX class="size-4" />
    </button>
  </div>
</template>
