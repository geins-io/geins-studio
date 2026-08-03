<script setup lang="ts">
import { formatFileSize } from '#shared/utils/file';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Upload dialog. Step 1 picks a method (only Quick upload is available in v0;
 * the wizard + CSV import are shown disabled with a "coming soon" tooltip).
 * Step 2 is quick upload: drag/drop or browse, pick a folder (with inline
 * create), and upload via `assetApi.upload`, then refresh the library.
 */
const props = defineProps<{
  /** Pre-selected target folder (e.g. the folder currently filtered). */
  defaultFolderId?: string | null;
}>();

const open = defineModel<boolean>('open', { default: false });

const { assetApi } = useGeinsRepository();
const { folders, refresh: refreshFolders } = useFolders();
const { resolveIcon } = useLucideIcon();
const { toast } = useToast();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog('components/AssetUploadDialog.vue');

const UPLOAD_METHODS = [
  { id: 'quick', icon: 'Upload', enabled: true },
  { id: 'wizard', icon: 'FileText', enabled: false },
  { id: 'csv', icon: 'FileDown', enabled: false },
] as const;

const step = ref<'choose' | 'quick'>('choose');
const method = ref<'quick' | 'wizard' | 'csv'>('quick');

const files = ref<File[]>([]);
const folderId = ref<string | null>(props.defaultFolderId ?? null);
const uploading = ref(false);
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const creatingFolder = ref(false);
const newFolderName = ref('');

watch(open, (value) => {
  if (value) {
    step.value = 'choose';
    method.value = 'quick';
    files.value = [];
    folderId.value = props.defaultFolderId ?? null;
    creatingFolder.value = false;
    newFolderName.value = '';
  }
});

function selectMethod(m: (typeof UPLOAD_METHODS)[number]) {
  if (m.enabled) method.value = m.id;
}
function goContinue() {
  if (method.value === 'quick') step.value = 'quick';
}

// Select needs string values, so map null ↔ a sentinel.
const NO_FOLDER = '__none__';
const folderModel = computed({
  get: () => folderId.value ?? NO_FOLDER,
  set: (value: string) => {
    folderId.value = value === NO_FOLDER ? null : value;
  },
});

function addFiles(list: FileList | null | undefined) {
  if (list) files.value = [...files.value, ...Array.from(list)];
}
function onDrop(event: DragEvent) {
  dragOver.value = false;
  addFiles(event.dataTransfer?.files);
}
function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  addFiles(input.files);
  input.value = '';
}
function removeFile(index: number) {
  files.value.splice(index, 1);
}

async function createFolder() {
  const name = newFolderName.value.trim();
  if (!name) {
    creatingFolder.value = false;
    return;
  }
  try {
    const folder = await assetApi.folder.create({
      name,
      parentId: null,
      sortOrder: 0,
    });
    await refreshFolders();
    folderId.value = folder._id;
  } catch (error) {
    geinsLogError('createFolder', getErrorMessage(error));
  }
  creatingFolder.value = false;
  newFolderName.value = '';
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
      title: t('assets_uploaded', { count: created.length }, created.length),
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
          <DialogTitle>{{ $t('upload_assets') }}</DialogTitle>
          <DialogDescription>
            {{ $t('upload_choose_description') }}
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
                    <div class="font-semibold">{{ $t(`upload_${m.id}`) }}</div>
                    <p class="text-muted-foreground mt-0.5 text-sm">
                      {{ $t(`upload_${m.id}_description`) }}
                    </p>
                  </div>
                  <span
                    class="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border"
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
          <Button variant="ghost" @click="open = false">
            <LucideChevronLeft class="size-4" />
            {{ $t('cancel') }}
          </Button>
          <Button @click="goContinue">{{ $t('continue') }}</Button>
        </DialogFooter>
      </template>

      <!-- Step 2 — quick upload -->
      <template v-else>
        <DialogHeader>
          <DialogTitle>{{ $t('upload_quick') }}</DialogTitle>
          <DialogDescription>{{ $t('upload_quick_hint') }}</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
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
            <span class="text-sm font-medium">{{ $t('drop_files_here') }}</span>
            <span class="text-muted-foreground text-xs">
              {{ $t('upload_accepted_types') }}
            </span>
          </button>
          <input
            ref="fileInput"
            type="file"
            multiple
            class="hidden"
            @change="onPick"
          />

          <div v-if="files.length" class="space-y-1">
            <div
              v-for="(file, index) in files"
              :key="index"
              class="bg-muted/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <span class="truncate">{{ file.name }}</span>
              <span class="text-muted-foreground ml-auto shrink-0 text-xs">
                {{ formatFileSize(file.size) }}
              </span>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive shrink-0"
                :aria-label="$t('remove')"
                @click="removeFile(index)"
              >
                <LucideX class="size-4" />
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>
              {{ $t('folder', 1) }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <div v-if="creatingFolder" class="flex gap-2">
              <Input
                v-model="newFolderName"
                :placeholder="$t('folder_name')"
                @keydown.enter.prevent="createFolder"
                @keydown.esc.prevent="creatingFolder = false"
              />
              <Button variant="secondary" @click="createFolder">
                {{ $t('save') }}
              </Button>
            </div>
            <div v-else class="flex gap-2">
              <Select v-model="folderModel">
                <SelectTrigger class="flex-1">
                  <SelectValue :placeholder="$t('no_folder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NO_FOLDER">
                    {{ $t('no_folder') }}
                  </SelectItem>
                  <SelectItem
                    v-for="folder in folders"
                    :key="folder._id"
                    :value="folder._id"
                  >
                    {{ folder.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" @click="creatingFolder = true">
                <LucidePlus class="size-4" />
                {{ $t('new') }}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter class="sm:justify-between">
          <Button
            variant="ghost"
            :disabled="uploading"
            @click="step = 'choose'"
          >
            <LucideChevronLeft class="size-4" />
            {{ $t('back') }}
          </Button>
          <Button
            :loading="uploading"
            :disabled="!files.length"
            @click="upload"
          >
            <LucideUpload class="size-4" />
            {{ $t('upload') }}
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>
