<script setup lang="ts">
import type { Asset } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Replace an asset's underlying file: drop/pick a single file, confirm, and
 * `assetApi.replace` swaps it while keeping the same asset id + metadata. The
 * updated asset is emitted so the opener can refresh its preview. Rendered
 * inside the detail panel so it stays in the panel's modal subtree.
 */
const props = defineProps<{ asset: Asset | null }>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ replaced: [Asset] }>();

const { assetApi } = useGeinsRepository();
const { toast } = useToast();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog('components/AssetReplaceDialog.vue');

const file = ref<File | null>(null);
const replacing = ref(false);
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

watch(open, (value) => {
  if (value) {
    file.value = null;
    dragOver.value = false;
  }
});

function pickFile(list: FileList | null | undefined) {
  const next = list?.[0];
  if (next) file.value = next;
}
function onDrop(event: DragEvent) {
  dragOver.value = false;
  pickFile(event.dataTransfer?.files);
}
function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  pickFile(input.files);
  input.value = '';
}

async function replace() {
  if (!props.asset || !file.value) return;
  replacing.value = true;
  const form = new FormData();
  form.append('file', file.value);
  try {
    const updated = await assetApi.replace(props.asset._id, form);
    await refreshNuxtData('asset-library-list');
    toast({ title: t('file_replaced'), variant: 'positive' });
    emit('replaced', updated);
    open.value = false;
  } catch (error) {
    geinsLogError('replace', getErrorMessage(error));
  } finally {
    replacing.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ $t('replace_file') }}</DialogTitle>
        <DialogDescription>{{ $t('replace_file_hint') }}</DialogDescription>
      </DialogHeader>

      <!-- min-w-0 keeps long file names from expanding the dialog grid track -->
      <div class="min-w-0 space-y-4">
        <button
          type="button"
          class="hover:bg-muted/40 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center transition-colors"
          :class="dragOver && 'border-primary bg-muted/40'"
          @click="fileInput?.click()"
          @drop.prevent="onDrop"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
        >
          <LucideUpload class="text-muted-foreground size-7" />
          <span class="text-sm font-medium">{{ $t('drop_file_here') }}</span>
          <span class="text-muted-foreground text-xs">
            {{ $t('upload_accepted_types') }}
          </span>
        </button>
        <input ref="fileInput" type="file" class="hidden" @change="onPick" />

        <AssetFileRow v-if="file" :file="file" @remove="file = null" />
      </div>

      <DialogFooter class="sm:justify-between">
        <Button variant="outline" :disabled="replacing" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <ButtonIcon
          icon="RefreshCw"
          :loading="replacing"
          :disabled="!file"
          @click="replace"
        >
          {{ $t('replace') }}
        </ButtonIcon>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
