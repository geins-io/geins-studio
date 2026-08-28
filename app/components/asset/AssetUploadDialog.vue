<script setup lang="ts">
import { entityListUrl } from '#shared/utils/entities';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Upload dialog. Step 1 picks a method: Quick upload or the multi-step wizard
 * (CSV import is still disabled with a "coming soon" tooltip). Quick upload
 * continues inline (step 2 below: drag/drop or browse, pick a folder with inline
 * create, upload via `assetApi.upload`, refresh the library). The wizard closes
 * the dialog and routes to the full-page wizard at `/asset-library/upload`.
 */
const props = defineProps<{
  /** Pre-selected target folder (e.g. the folder currently filtered). */
  defaultFolderId?: string | null;
}>();

const open = defineModel<boolean>('open', { default: false });

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

const step = ref<'choose' | 'quick'>('choose');
const method = ref<'quick' | 'wizard' | 'csv'>('quick');

const files = ref<File[]>([]);
const folderId = ref<string | null>(props.defaultFolderId ?? null);
const uploading = ref(false);

watch(open, (value) => {
  if (value) {
    step.value = 'choose';
    method.value = 'quick';
    files.value = [];
    folderId.value = props.defaultFolderId ?? null;
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

function addFiles(list: File[]) {
  files.value = [...files.value, ...list];
}
function removeFile(index: number) {
  files.value.splice(index, 1);
}

async function upload() {
  if (!files.value.length) return;
  uploading.value = true;
  const form = new FormData();
  for (const file of files.value) form.append('files', file);
  if (folderId.value) form.append('folderId', folderId.value);
  try {
    const created = await assetApi.upload(form);
    await refreshNuxtData('asset-library-list');
    toast({
      title: t(
        'asset_library.assets_uploaded',
        { count: created.length },
        created.length,
      ),
      variant: 'positive',
    });
    open.value = false;
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
            <Tooltip v-for="m in UPLOAD_METHODS" :key="m.id">
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
          <AssetDropzone @add="addFiles" />

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
        </div>

        <DialogFooter class="sm:justify-between">
          <ButtonIcon
            icon="ChevronLeft"
            variant="ghost"
            :disabled="uploading"
            @click="step = 'choose'"
          >
            {{ $t('back') }}
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
