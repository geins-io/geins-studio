<script setup lang="ts">
import type { Asset, UploadRejectionCode } from '#shared/types';
import { uploadRejectionMessageKey } from '#shared/utils/asset';
import { entityListUrl } from '#shared/utils/entities';
import { useToast } from '@/components/ui/toast/use-toast';

type UploadMethodId = 'quick' | 'wizard' | 'csv';

/**
 * Upload dialog. Step 1 picks a method: Quick upload or the multi-step wizard
 * (CSV import is still disabled with a "coming soon" tooltip). Quick upload
 * continues inline (step 2 below: drag/drop or browse, pick a folder with inline
 * create, upload via `assetApi.uploadViaTickets`, refresh the library). The
 * wizard closes the dialog and routes to the full-page wizard at
 * `/asset-library/upload`.
 *
 * `methods` restricts the offered methods; when only one remains the chooser is
 * skipped entirely (the asset picker embeds it as quick-only so it never routes
 * away from the entity). `multiple` = false constrains quick upload to a single
 * file. On success `uploaded` emits the created assets so an embedder (e.g. the
 * picker) can auto-select them.
 */
const props = withDefaults(
  defineProps<{
    /** Pre-selected target folder (e.g. the folder currently filtered). */
    defaultFolderId?: string | null;
    /** Which upload methods to offer. A single entry skips the chooser. */
    methods?: readonly UploadMethodId[];
    /** Allow selecting several files in quick upload. `false` = single file. */
    multiple?: boolean;
  }>(),
  {
    defaultFolderId: null,
    methods: () => ['quick', 'wizard', 'csv'],
    multiple: true,
  },
);

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{ uploaded: [assets: Asset[]] }>();

const { assetApi } = useGeinsRepository();
const { resolveIcon } = useLucideIcon();
const { toast } = useToast();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog('components/AssetUploadDialog.vue');

const UPLOAD_METHODS = [
  { id: 'quick', icon: 'Upload', enabled: true },
  { id: 'wizard', icon: 'FileText', enabled: true },
  { id: 'csv', icon: 'FileDown', enabled: false },
] as const;

const availableMethods = computed(() =>
  UPLOAD_METHODS.filter((m) => props.methods.includes(m.id)),
);
// One offered method → no chooser; open straight into quick upload.
const skipChooser = computed(() => availableMethods.value.length === 1);

const step = ref<'choose' | 'quick'>('choose');
const method = ref<UploadMethodId>('quick');

const files = ref<File[]>([]);
const folderId = ref<string | null>(props.defaultFolderId ?? null);
const uploading = ref(false);
// Per-file rejections shown inline when nothing uploaded (so the user can fix).
const rejected = ref<{ name: string; code: UploadRejectionCode }[]>([]);

watch(open, (value) => {
  if (value) {
    method.value = availableMethods.value[0]?.id ?? 'quick';
    step.value = skipChooser.value ? 'quick' : 'choose';
    files.value = [];
    folderId.value = props.defaultFolderId ?? null;
    rejected.value = [];
  }
});

function selectMethod(m: (typeof UPLOAD_METHODS)[number]) {
  if (m.enabled) method.value = m.id;
}
function goContinue() {
  if (method.value === 'quick') {
    step.value = 'quick';
  } else if (method.value === 'wizard') {
    open.value = false;
    navigateTo(`${entityListUrl('asset')}/upload`);
  }
}
// No chooser to fall back to when quick is the only method — the back button
// cancels instead.
function backFromQuick() {
  if (skipChooser.value) open.value = false;
  else step.value = 'choose';
}

function addFiles(list: File[]) {
  files.value = props.multiple ? [...files.value, ...list] : list.slice(0, 1);
}
function removeFile(index: number) {
  files.value.splice(index, 1);
}

async function upload() {
  if (!files.value.length) return;
  uploading.value = true;
  rejected.value = [];
  // Index as clientRef so a rejection maps back to its file (for the reason list).
  const items = files.value.map((file, i) => ({
    file,
    clientRef: String(i),
    folderId: folderId.value,
  }));
  try {
    const results = await assetApi.uploadViaTickets(items);
    await refreshNuxtData('asset-library-list');
    const created = results.flatMap((r) =>
      r.status === 'completed' ? [r.file] : [],
    );
    const fails = results.flatMap((r) => (r.status === 'rejected' ? [r] : []));

    if (created.length) {
      toast({
        title: fails.length
          ? t('asset_library.upload_partial', {
              created: created.length,
              total: files.value.length,
            })
          : t(
              'asset_library.assets_uploaded',
              { count: created.length },
              created.length,
            ),
        variant: fails.length ? 'warning' : 'positive',
      });
      emit('uploaded', created);
    }

    // Nothing uploaded → keep the dialog open and show why; otherwise close.
    if (fails.length && !created.length) {
      rejected.value = fails.map((r) => ({
        name: files.value[Number(r.clientRef)]?.name ?? r.clientRef,
        code: r.code,
      }));
    } else {
      open.value = false;
    }
  } catch (error) {
    geinsLogError('upload', getErrorMessage(error));
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <!-- Step 1 — choose method -->
      <template v-if="step === 'choose'">
        <DialogHeader>
          <DialogTitle>{{ $t('asset_library.upload_assets') }}</DialogTitle>
          <DialogDescription>
            {{ $t('asset_library.upload_choose_description') }}
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider :delay-duration="150">
          <div class="space-y-3">
            <Tooltip v-for="m in availableMethods" :key="m.id">
              <TooltipTrigger as-child>
                <button
                  type="button"
                  :aria-disabled="!m.enabled"
                  class="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors"
                  :class="
                    !m.enabled
                      ? 'cursor-not-allowed opacity-60'
                      : method === m.id
                        ? 'border-primary bg-muted/30'
                        : 'hover:bg-muted/40'
                  "
                  @click="selectMethod(m)"
                >
                  <div
                    class="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    :class="
                      m.enabled && method === m.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    "
                  >
                    <component :is="resolveIcon(m.icon)" class="size-5" />
                  </div>
                  <div class="flex-1">
                    <div class="font-semibold">
                      {{ $t(`asset_library.upload_${m.id}`) }}
                    </div>
                    <p class="text-muted-foreground mt-0.5 text-sm">
                      {{ $t(`asset_library.upload_${m.id}_description`) }}
                    </p>
                  </div>
                  <span
                    class="flex size-5 shrink-0 items-center justify-center self-center rounded-full border"
                    :class="
                      m.enabled && method === m.id
                        ? 'border-primary'
                        : 'border-input'
                    "
                  >
                    <span
                      v-if="m.enabled && method === m.id"
                      class="bg-primary size-2.5 rounded-full"
                    />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent v-if="!m.enabled">
                {{ $t('coming_soon') }}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <DialogFooter class="sm:justify-between">
          <ButtonIcon icon="ChevronLeft" variant="ghost" @click="open = false">
            {{ $t('cancel') }}
          </ButtonIcon>
          <Button @click="goContinue">{{ $t('continue') }}</Button>
        </DialogFooter>
      </template>

      <!-- Step 2 — quick upload -->
      <template v-else>
        <DialogHeader>
          <DialogTitle>{{ $t('asset_library.upload_quick') }}</DialogTitle>
          <DialogDescription>
            {{ $t('asset_library.upload_quick_hint') }}
          </DialogDescription>
        </DialogHeader>

        <!-- min-w-0: DialogContent is a grid, so this keeps long file names
             from expanding the track past the dialog (lets truncate work) -->
        <div class="min-w-0 space-y-4">
          <AssetDropzone :multiple="multiple" @add="addFiles" />

          <div v-if="files.length" class="max-h-72 space-y-2 overflow-y-auto">
            <AssetFileRow
              v-for="(file, index) in files"
              :key="index"
              :file="file"
              @remove="removeFile(index)"
            />
          </div>

          <div class="space-y-1.5">
            <Label>
              {{ $t('folder', 1) }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <AssetFolderPicker v-model="folderId" />
          </div>

          <!-- Rejections when nothing uploaded — friendly reason per file. -->
          <div v-if="rejected.length" class="space-y-1.5">
            <div
              v-for="(row, i) in rejected"
              :key="i"
              class="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md px-3 py-2 text-sm"
            >
              <LucideFileX class="mt-0.5 size-4 shrink-0" />
              <div class="min-w-0">
                <p class="truncate font-medium">{{ row.name }}</p>
                <p class="text-xs opacity-90">
                  {{ $t(uploadRejectionMessageKey(row.code)) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter class="sm:justify-between">
          <ButtonIcon
            icon="ChevronLeft"
            variant="ghost"
            :disabled="uploading"
            @click="backFromQuick"
          >
            {{ skipChooser ? $t('cancel') : $t('back') }}
          </ButtonIcon>
          <ButtonIcon
            icon="upload"
            :loading="uploading"
            :disabled="!files.length"
            @click="upload"
          >
            {{ $t('upload') }}
          </ButtonIcon>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
