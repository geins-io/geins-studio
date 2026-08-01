<script setup lang="ts">
import { formatFileSize } from '#shared/utils/file';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Quick upload — drag/drop or browse, pick a folder (with inline create), and
 * upload via `assetApi.upload`. On success refreshes the library list.
 */
const props = defineProps<{
  /** Pre-selected target folder (e.g. the folder currently filtered). */
  defaultFolderId?: string | null;
}>();

const open = defineModel<boolean>('open', { default: false });

const { assetApi } = useGeinsRepository();
const { folders, refresh: refreshFolders } = useFolders();
const { toast } = useToast();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog('components/AssetUploadDialog.vue');

const files = ref<File[]>([]);
const folderId = ref<string | null>(props.defaultFolderId ?? null);
const uploading = ref(false);
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const creatingFolder = ref(false);
const newFolderName = ref('');

watch(open, (value) => {
  if (value) {
    files.value = [];
    folderId.value = props.defaultFolderId ?? null;
    creatingFolder.value = false;
    newFolderName.value = '';
  }
});

// Select needs string values, so map null ↔ a sentinel.
const NO_FOLDER = '__none__';
const folderModel = computed({
  get: () => folderId.value ?? NO_FOLDER,
  set: (value: string) => {
    folderId.value = value === NO_FOLDER ? null : value;
  },
});

const totalSize = computed(() =>
  files.value.reduce((sum, file) => sum + file.size, 0),
);

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
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('upload_assets') }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Dropzone -->
        <button
          type="button"
          class="hover:bg-muted/50 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors"
          :class="dragOver && 'border-primary bg-muted/50'"
          @click="fileInput?.click()"
          @drop.prevent="onDrop"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
        >
          <LucideUpload class="text-muted-foreground size-6" />
          <span class="text-muted-foreground text-sm">
            {{ $t('drop_files_here') }}
          </span>
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="onPick"
        />

        <!-- Selected files -->
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

        <!-- Folder -->
        <div class="space-y-1.5">
          <Label>{{ $t('folder', 1) }}</Label>
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
              {{ $t('new_entity', { entityKey: 'folder' }) }}
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <span
          v-if="files.length"
          class="text-muted-foreground mr-auto self-center text-xs"
        >
          {{ files.length }} · {{ formatFileSize(totalSize) }}
        </span>
        <Button variant="outline" :disabled="uploading" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <Button :loading="uploading" :disabled="!files.length" @click="upload">
          {{ $t('upload_assets') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
