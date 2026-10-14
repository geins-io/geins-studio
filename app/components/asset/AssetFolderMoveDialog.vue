<script setup lang="ts">
import { ROOT_FOLDER_KEY, folderIdForSelection } from '#shared/utils/asset';
import type { FolderNode } from '@/composables/useFolders';

/**
 * Picks a new parent for a folder: the `AssetBulkMoveFolder` pane (URL
 * warning + folder tree) in a dialog. The folder's own subtree can't be picked
 * (a folder can't go inside itself), nor its current parent (a no-op).
 * Emits the new `parentFolderId` — `null` for Uncategorised, the library root.
 */
const props = defineProps<{
  folder: FolderNode | null;
  loading?: boolean;
}>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{ confirm: [parentFolderId: string | null] }>();

const { descendantIds } = useFolders();

const destination = ref<string | null>(null);
watch(open, (value) => {
  if (value) destination.value = null;
});

const disabledIds = computed(() =>
  props.folder
    ? [
        ...descendantIds(props.folder._id),
        props.folder.parentFolderId ?? ROOT_FOLDER_KEY,
      ]
    : [],
);
const canMove = computed(
  () =>
    destination.value !== null &&
    !disabledIds.value.includes(destination.value),
);

function confirm() {
  if (canMove.value) emit('confirm', folderIdForSelection(destination.value));
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t('move_entity', { entityKey: 'folder' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t('asset_library.move_folder_description', {
              name: folder?.name ?? '',
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 overflow-y-auto">
        <AssetBulkMoveFolder
          v-model="destination"
          folder
          :disabled-ids="disabledIds"
        />
      </div>

      <DialogFooter class="sm:justify-between">
        <Button variant="ghost" :disabled="loading" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <Button :loading="loading" :disabled="!canMove" @click="confirm">
          {{ $t('move_entity', { entityKey: 'folder' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
