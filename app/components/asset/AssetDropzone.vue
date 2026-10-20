<script setup lang="ts">
/**
 * Drag-and-drop / click-to-browse dropzone for selecting files to upload.
 * Purely a picker — it holds no file state, just emits the chosen files so the
 * consumer (quick-upload dialog, upload wizard) owns the list. Multiple files
 * per pick by default; the native input is reset after each pick so re-selecting
 * the same file fires `change` again.
 */
const props = withDefaults(
  defineProps<{
    /** `lg` gives a taller drop target (upload wizard); `md` is the compact dialog. */
    size?: 'md' | 'lg';
    /** Allow picking several files at once. `false` = single file (only the first is emitted). */
    multiple?: boolean;
  }>(),
  { size: 'md', multiple: true },
);
const emit = defineEmits<{ add: [File[]] }>();

const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function emitFiles(list: FileList | null | undefined) {
  if (!list || !list.length) return;
  const files = Array.from(list);
  emit('add', props.multiple ? files : files.slice(0, 1));
}
function onDrop(event: DragEvent) {
  dragOver.value = false;
  emitFiles(event.dataTransfer?.files);
}
function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  emitFiles(input.files);
  input.value = '';
}
</script>

<template>
  <div class="min-w-0">
    <button
      type="button"
      class="hover:bg-muted/40 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center transition-[padding,background-color,border-color] duration-300"
      :class="[
        dragOver && 'border-primary bg-muted/40',
        size === 'lg' ? 'py-24' : 'py-12',
      ]"
      @click="fileInput?.click()"
      @drop.prevent="onDrop"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
    >
      <div
        class="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
      >
        <LucideUpload class="text-muted-foreground size-5" />
      </div>
      <span class="text-sm font-medium">
        {{
          $t(
            multiple
              ? 'asset_library.drop_files_here'
              : 'asset_library.drop_file_here',
          )
        }}
      </span>
      <span class="text-muted-foreground text-xs">
        {{ $t('asset_library.upload_accepted_types') }}
      </span>
    </button>
    <input
      ref="fileInput"
      type="file"
      :multiple="multiple"
      class="hidden"
      @change="onPick"
    />
  </div>
</template>
