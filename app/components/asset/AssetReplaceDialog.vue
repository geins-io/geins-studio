<script setup lang="ts">
import type { Asset, AssetLink, UploadCompleteResult } from '#shared/types';
import {
  isReplaceExtensionAllowed,
  replaceErrorMessageKey,
  replaceExtensions,
  uploadRejectionMessageKey,
} from '#shared/utils/asset';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Replace an asset's underlying file: drop/pick a single file, confirm, and
 * `assetApi.replace` overwrites the bytes in place — same id, path and
 * metadata. The path never changes, so the new file must keep the asset's
 * extension (or an alias). The warning counts the asset's usage links. On
 * success the asset is refetched (new `url` version + etag) and emitted.
 * Rendered inside the detail panel so it stays in the panel's modal subtree.
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
// i18n key for why the last attempt failed; the original file is kept either
// way (a rejected replacement is rolled back server-side).
const failure = ref<string | null>(null);

const allowedExtensions = computed(() =>
  replaceExtensions(props.asset?.name ?? ''),
);
const extensionList = computed(() => allowedExtensions.value.join(', '));
// A drop bypasses the input's `accept`, so the extension is re-checked here.
const extensionMismatch = computed(
  () =>
    !!file.value &&
    !!props.asset &&
    !isReplaceExtensionAllowed(props.asset.name, file.value.name),
);

// Only the count is shown — the panel behind the dialog already lists the links.
const {
  data: links,
  status: linksStatus,
  execute: loadLinks,
} = useAsyncData<AssetLink[]>(
  'asset-replace-links',
  () => (props.asset ? assetApi.links(props.asset._id) : Promise.resolve([])),
  { default: () => [], immediate: false },
);
// A floor, not a total: links don't cover use by URL, and a link can outlive
// its target. Matching `assetId` drops a previous asset's still-cached read;
// pending, failed (incl. 404 for a trashed asset) or empty all fall back to the
// static warning.
const linkCount = computed(() =>
  linksStatus.value === 'success'
    ? (links.value ?? []).filter((l) => l.assetId === props.asset?._id).length
    : 0,
);

watch(open, (value) => {
  if (value) {
    file.value = null;
    failure.value = null;
    dragOver.value = false;
    loadLinks();
  }
});

function pickFile(list: FileList | null | undefined) {
  const next = list?.[0];
  if (next) {
    file.value = next;
    failure.value = null;
  }
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
  if (!props.asset || !file.value || extensionMismatch.value) return;
  const id = props.asset._id;
  replacing.value = true;
  failure.value = null;
  let result: UploadCompleteResult;
  try {
    // Failures are explained inline next to the file, not as a global toast.
    result = await assetApi.replace(id, file.value, {
      suppressErrorToast: true,
    });
  } catch (error) {
    failure.value = replaceErrorMessageKey(getErrorStatus(error));
    geinsLogError('replace', getErrorMessage(error));
    replacing.value = false;
    return;
  }
  if (result.status === 'rejected') {
    failure.value = uploadRejectionMessageKey(result.code);
    replacing.value = false;
    return;
  }
  // The file is replaced from here on, so nothing below may surface as a
  // replace failure. Refetch so the preview picks up the new `url` version and
  // the next PATCH sends the new etag; the completed row is the fallback.
  try {
    const updated = await assetApi.get(id).catch(() => result.file);
    await refreshNuxtData('asset-library-list');
    toast({
      title: t('entity_replaced', { entityKey: 'file' }),
      variant: 'positive',
    });
    emit('replaced', updated);
    open.value = false;
  } finally {
    replacing.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ $t('asset_library.replace_file') }}</DialogTitle>
        <DialogDescription>
          {{ $t('asset_library.replace_file_hint') }}
        </DialogDescription>
      </DialogHeader>

      <!-- min-w-0 keeps long file names from expanding the dialog grid track -->
      <div class="min-w-0 space-y-4">
        <Feedback type="warning">
          <template #title>
            {{ $t('asset_library.replacing_everywhere') }}
          </template>
          <template #description>
            {{
              linkCount
                ? $t(
                    'asset_library.replace_warning_count',
                    { count: linkCount },
                    linkCount,
                  )
                : $t('asset_library.replace_warning')
            }}
          </template>
        </Feedback>

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
          <span class="text-sm font-medium">
            {{ $t('asset_library.drop_file_here') }}
          </span>
          <span class="text-muted-foreground text-xs">
            {{
              extensionList
                ? $t('asset_library.replace_accepted_types', {
                    extensions: extensionList,
                  })
                : $t('asset_library.upload_accepted_types')
            }}
          </span>
        </button>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          :accept="extensionList || undefined"
          @change="onPick"
        />

        <AssetFileRow v-if="file" :file="file" @remove="file = null" />

        <Feedback v-if="extensionMismatch" type="negative">
          <template #title>
            {{ $t('asset_library.replace_extension_mismatch_title') }}
          </template>
          <template #description>
            {{
              $t('asset_library.replace_extension_mismatch', {
                extensions: extensionList,
              })
            }}
          </template>
        </Feedback>
        <Feedback v-else-if="failure" type="negative">
          <template #title>
            {{ $t('asset_library.replace_failed') }}
          </template>
          <template #description>
            {{ $t(failure) }} {{ $t('asset_library.replace_original_kept') }}
          </template>
        </Feedback>
      </div>

      <DialogFooter class="sm:justify-between">
        <Button variant="outline" :disabled="replacing" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <ButtonIcon
          icon="RefreshCw"
          :loading="replacing"
          :disabled="!file || extensionMismatch"
          @click="replace"
        >
          {{ $t('asset_library.replace_everywhere') }}
        </ButtonIcon>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
