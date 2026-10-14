<script setup lang="ts">
import type {
  BackgroundJobSpec,
  Folder,
  FolderDeleteAction,
  FolderDeletion,
  FolderUpdate,
  JobMessage,
} from '#shared/types';
import {
  FOLDER_DELETE_MAX,
  ROOT_FOLDER_KEY,
  TRASH_KEY,
  folderDeleteFailure,
  folderRestoreFailure,
  trashedFolderId,
  trashedFolderKey,
} from '#shared/utils/asset';
import { chunkIds } from '#shared/utils/bulk';
import { useToast } from '@/components/ui/toast/use-toast';
import type { FolderNode } from '@/composables/useFolders';

/**
 * Folder navigation tree (shadcn Sidebar). "Folders" header, then "All assets",
 * the nested folders (add subfolder + a `⋯` menu to rename, move or delete on
 * hover), the pinned "Uncategorised" and "Trash" views, and a "New folder"
 * action. Trash folds out
 * to the trashed folders (restore / delete permanently on hover). Selection via
 * `v-model:selected` — a folder id, `null` for All, `ROOT_FOLDER_KEY` for
 * Uncategorised (assets with no folder), `TRASH_KEY` for the soft-deleted
 * ones, or `trashedFolderKey(id)` for one trashed folder's contents — drives
 * the server-side query.
 * Must be used inside a `SidebarProvider` / `Sidebar`.
 *
 * `readonly` makes the rail selection-only — every folder mutation control
 * (hover actions, "New folder", the dialogs) is gated off. Used by the asset
 * picker, where folder management must stay on the library page.
 * `hideAll` drops "All assets" for a destination picker (e.g. bulk move), where
 * it isn't a place an asset can go. `disabledIds` (selection keys, so
 * `ROOT_FOLDER_KEY` too) can't be picked — a folder move's own subtree.
 */
const props = defineProps<{
  readonly?: boolean;
  hideAll?: boolean;
  disabledIds?: string[];
}>();

const selected = defineModel<string | null>('selected', { default: null });

const { tree, loading, refresh, descendantIds } = useFolders();
const { assetApi } = useGeinsRepository();
const { resolveIcon } = useLucideIcon();
const { toast } = useToast();
const backgroundJobs = useBackgroundJobs();
const { movingFolderIds } = backgroundJobs;
const { t } = useI18n();
const { geinsLogError } = useGeinsLog('components/AssetFolderTree.vue');

const allIcon = computed(() =>
  resolveIcon(selected.value === null ? 'FolderOpenDot' : 'FolderDot'),
);

const addingTop = ref(false);

async function createFolder(payload: {
  parentFolderId: string | null;
  name: string;
}) {
  try {
    await assetApi.folder.create({
      name: payload.name,
      parentFolderId: payload.parentFolderId,
    });
    await refresh();
    toast({
      title: t('entity_added', { entityKey: 'folder' }),
      variant: 'positive',
    });
  } catch (error) {
    geinsLogError('createFolder', getErrorMessage(error));
  } finally {
    addingTop.value = false;
  }
}

const deleteTarget = ref<FolderNode | null>(null);
const deleteOpen = ref(false);
const choiceOpen = ref(false);
const deleting = ref(false);
// Live assets under the folder (subtree included), for the options' copy;
// `null` when the count failed.
const liveCount = ref<number | null>(null);
// Failures render inside the dialog that triggered them (the calls suppress the
// global toast), so the user can pick another option or retry in place.
const deleteError = ref<string>();
const choiceError = ref<string>();
// The folder whose contents are being counted; its row shows a spinner.
const inspectingId = ref<string | null>(null);

// Only a folder proven empty (no subfolders, no live or trashed assets) gets
// the plain confirm; anything else, or a failed count, goes straight to the
// options, whose trash action is safe on an empty folder too.
async function requestDelete(node: FolderNode) {
  if (inspectingId.value) return;
  inspectingId.value = node._id;
  deleteTarget.value = node;
  deleteError.value = undefined;
  choiceError.value = undefined;
  try {
    const [live, trashed] = await Promise.all([
      countAssets(node._id),
      countAssets(node._id, true),
    ]);
    liveCount.value = live;
    // `descendantIds` includes the folder itself, so 1 means no subfolders.
    const empty =
      live === 0 && trashed === 0 && descendantIds(node._id).length <= 1;
    if (empty) deleteOpen.value = true;
    else choiceOpen.value = true;
  } finally {
    inspectingId.value = null;
  }
}

function failureMessage(error: unknown, action?: FolderDeleteAction) {
  const failure = folderDeleteFailure(
    getErrorStatus(error),
    getApiErrorDetail(error),
    action,
  );
  if (failure === 'failed' || failure === 'not_empty')
    return t('error_try_again');
  return t(`asset_library.folder_delete_${failure}`, {
    max: FOLDER_DELETE_MAX,
  });
}

async function countAssets(
  folderId: string,
  trashed = false,
): Promise<number | null> {
  try {
    const result = await assetApi.query(
      { page: 1, pageSize: 1, sort: null, search: '', filters: {} },
      { folderId, ...(trashed ? { trashed } : {}) },
    );
    return result.totalItemCount;
  } catch {
    return null;
  }
}

// Runs once the delete has succeeded, so a failed refetch only logs — it must
// not read as a failed delete.
async function afterDelete(removed: string[]) {
  // Deleting the active folder (or an ancestor of it) drops the filter target.
  if (selected.value && removed.includes(selected.value)) {
    selected.value = null;
  }
  try {
    await refresh();
    await refreshNuxtData([
      'asset-library-list',
      'asset-tags',
      'asset-trash-folders',
    ]);
  } catch (error) {
    geinsLogError('afterDelete', getErrorMessage(error));
  }
}

// The action-less delete only takes an empty folder. A not-empty 409 can still
// happen (e.g. a trashed empty subfolder the tree doesn't list), so it swaps
// the confirm for the options.
async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  const removed = descendantIds(target._id);
  deleting.value = true;
  deleteError.value = undefined;
  try {
    await assetApi.folder.delete(target._id, { suppressErrorToast: true });
  } catch (error) {
    if (
      folderDeleteFailure(getErrorStatus(error), getApiErrorDetail(error)) ===
      'not_empty'
    ) {
      choiceError.value = undefined;
      deleteOpen.value = false;
      choiceOpen.value = true;
    } else {
      geinsLogError('deleteFolder', getErrorMessage(error));
      deleteError.value = failureMessage(error);
    }
    return;
  } finally {
    deleting.value = false;
  }
  deleteOpen.value = false;
  toast({
    title: t('entity_deleted', { entityKey: 'folder' }),
    variant: 'positive',
  });
  await afterDelete(removed);
}

const DELETION_TOAST: Record<FolderDeleteAction, string> = {
  trash: 'entity_moved_to_trash',
  relocate: 'entity_moved_to_trash',
  purge: 'entity_deleted',
};

// relocate + purge answer 202: the folders leave the tree at once, but the
// assets land later (moved to the root, or purged), so a background job toasts
// and refreshes again once they have. Nothing left to land toasts right away.
function deletionJobSpec(
  action: FolderDeleteAction,
  { assetCount, moveId }: FolderDeletion,
): BackgroundJobSpec | null {
  if (action === 'relocate' && moveId) {
    return { kind: 'move', moveIds: [moveId] };
  }
  if (action === 'purge' && assetCount) return { kind: 'due-purge' };
  return null;
}

async function confirmChoice(action: FolderDeleteAction) {
  const target = deleteTarget.value;
  if (!target) return;
  const removed = descendantIds(target._id);
  deleting.value = true;
  choiceError.value = undefined;
  let deletion: FolderDeletion;
  try {
    deletion = await assetApi.deleteFolder(target._id, action, {
      suppressErrorToast: true,
    });
  } catch (error) {
    geinsLogError('deleteFolder', getErrorMessage(error));
    choiceError.value = failureMessage(error, action);
    return;
  } finally {
    deleting.value = false;
  }
  const { assetCount } = deletion;
  choiceOpen.value = false;
  const doneMessage: JobMessage = {
    key: DELETION_TOAST[action],
    params: { entityKey: 'folder' },
  };
  const doneDescription: JobMessage | undefined = assetCount
    ? {
        key: `asset_library.folder_delete_${action}_done`,
        params: { count: assetCount },
        plural: assetCount,
      }
    : undefined;
  const spec = deletionJobSpec(action, deletion);
  if (spec) {
    backgroundJobs.start({
      spec,
      label: {
        key: 'asset_library.job_deleting_folder',
        params: { name: target.name },
      },
      doneMessage,
      doneDescription,
      refreshKeys: [
        'asset-folders',
        'asset-trash-folders',
        'asset-library-list',
        'asset-tags',
      ],
    });
  } else {
    toast({
      title: backgroundJobs.message(doneMessage),
      description: doneDescription && backgroundJobs.message(doneDescription),
      variant: 'positive',
    });
  }
  await afterDelete(removed);
}

// A pending rename/move holds the folder's whole subtree: its paths move too.
const lockedIds = computed(() =>
  [...movingFolderIds.value].flatMap((id) => descendantIds(id)),
);
// Per folder, so a rename on one row isn't dropped while another row saves.
const updatingIds = ref<string[]>([]);
const busyIds = computed(() =>
  inspectingId.value
    ? [inspectingId.value, ...updatingIds.value]
    : updatingIds.value,
);
const moveTarget = ref<FolderNode | null>(null);
const moveOpen = ref(false);

// `PUT` is a full replace, so a rename sends the current parent and a move the
// current name. The folder rows change at once; a `moveId` means the assets'
// files are still being copied to the new path, so a background job refreshes
// again and toasts once they land. Failures go to the global error toast
// (a sibling with the same name is a 409).
async function updateFolder(
  node: FolderNode,
  body: FolderUpdate,
  kind: 'rename' | 'move',
): Promise<boolean> {
  if (updatingIds.value.includes(node._id)) return false;
  updatingIds.value = [...updatingIds.value, node._id];
  try {
    const updated = await assetApi.folder.update(node._id, body);
    await refreshAfterUpdate();
    const doneMessage: JobMessage = {
      key: 'entity_updated',
      params: { entityKey: 'folder' },
    };
    if (updated?.moveId) {
      backgroundJobs.start({
        spec: {
          kind: 'move',
          moveIds: [updated.moveId],
          folderIds: [node._id],
        },
        label: {
          key:
            kind === 'rename'
              ? 'asset_library.job_renaming_folder'
              : 'asset_library.job_moving_folder',
          params: { name: node.name },
        },
        ...(kind === 'rename' && {
          activity: { key: 'background_jobs.renaming' },
        }),
        doneMessage,
        refreshKeys: ['asset-folders', 'asset-library-list'],
      });
    } else {
      toast({
        title: backgroundJobs.message(doneMessage),
        variant: 'positive',
      });
    }
    return true;
  } catch (error) {
    geinsLogError('updateFolder', getErrorMessage(error));
    return false;
  } finally {
    updatingIds.value = updatingIds.value.filter((id) => id !== node._id);
  }
}

// Runs once the update has succeeded, so a failed refetch only logs.
async function refreshAfterUpdate() {
  try {
    await refreshNuxtData(['asset-folders', 'asset-library-list']);
  } catch (error) {
    geinsLogError('refreshAfterUpdate', getErrorMessage(error));
  }
}

function renameFolder({ node, name }: { node: FolderNode; name: string }) {
  void updateFolder(
    node,
    { name, parentFolderId: node.parentFolderId },
    'rename',
  );
}

function requestMove(node: FolderNode) {
  moveTarget.value = node;
  moveOpen.value = true;
}

async function confirmMove(parentFolderId: string | null) {
  const target = moveTarget.value;
  if (!target) return;
  const moved = await updateFolder(
    target,
    { name: target.name, parentFolderId },
    'move',
  );
  if (moved) moveOpen.value = false;
}

// Trashed folders under Trash. The picker (`readonly`) never shows the trash.
const { data: trashedData, refresh: refreshTrashed } = useAsyncData<Folder[]>(
  'asset-trash-folders',
  () => assetApi.folder.listTrashed(),
  { default: () => [], immediate: !props.readonly },
);
// The backend reaps an emptied trashed folder only after a while, so a folder
// purged here is hidden for the rest of the session instead of lingering.
const purgedIds = ref<string[]>([]);
const trashedNodes = computed<FolderNode[]>(() =>
  (Array.isArray(trashedData.value) ? trashedData.value : [])
    .filter((folder) => !purgedIds.value.includes(folder._id))
    .map((folder) => ({ ...folder, children: [] })),
);
const trashOpen = ref(false);
watch(
  selected,
  (value) => {
    if (trashedFolderId(value)) trashOpen.value = true;
  },
  { immediate: true },
);

async function refreshTrashView() {
  try {
    await refreshNuxtData([
      'asset-folders',
      'asset-trash-folders',
      'asset-library-list',
      'asset-tags',
    ]);
  } catch (error) {
    geinsLogError('refreshTrashView', getErrorMessage(error));
  }
}

const restoringId = ref<string | null>(null);

// No room for an inline message in the rail, so a failure is a toast — with
// friendly copy, since the backend's 409 detail is a bare id.
async function restoreTrashed(node: FolderNode) {
  if (restoringId.value) return;
  restoringId.value = node._id;
  try {
    await assetApi.folder.restore(node._id, { suppressErrorToast: true });
  } catch (error) {
    geinsLogError('restoreFolder', getErrorMessage(error));
    const failure = folderRestoreFailure(
      getErrorStatus(error),
      getApiErrorDetail(error),
    );
    toast({
      title: t('error_updating_entity', { entityKey: 'folder' }),
      description:
        failure === 'failed'
          ? t('error_try_again')
          : t(`asset_library.folder_restore_${failure}`),
      variant: 'negative',
    });
    if (failure === 'not_found') await refreshTrashed();
    return;
  } finally {
    restoringId.value = null;
  }
  toast({
    title: t('entity_restored', { entityKey: 'folder' }),
    variant: 'positive',
  });
  // Viewing the restored folder's trash would now be empty; show it live.
  if (selected.value === trashedFolderKey(node._id)) selected.value = node._id;
  await refreshTrashView();
}

const purgeTarget = ref<FolderNode | null>(null);
const purgeOpen = ref(false);
const purging = ref(false);
const purgeError = ref<string>();
const purgeDescription = computed(
  () =>
    `${t('asset_library.trashed_folder_purge_description')} ${t('asset_library.purge_note')}`,
);

function requestPurge(node: FolderNode) {
  purgeTarget.value = node;
  purgeError.value = undefined;
  purgeOpen.value = true;
}

// Purges the folder's trashed assets (the documented route for trashed items);
// the backend then deletes the emptied folder on its own. The purge lands about
// a minute later, so a background job toasts and refreshes once it has.
async function confirmPurge() {
  const target = purgeTarget.value;
  if (!target) return;
  purging.value = true;
  purgeError.value = undefined;
  let assetCount = 0;
  let found = 0;
  const purged: string[] = [];
  try {
    const assets = await assetApi.matchingAssets(
      { page: 1, pageSize: 1, sort: null, search: '', filters: {} },
      { folderId: target._id, trashed: true },
    );
    found = assets.length;
    for (const ids of chunkIds(assets.map((asset) => asset._id))) {
      const result = await assetApi.bulkPurge(ids, {
        suppressErrorToast: true,
      });
      assetCount += result.assetCount;
      purged.push(...ids);
    }
  } catch (error) {
    geinsLogError('purgeFolder', getErrorMessage(error));
    purgeError.value = t('error_try_again');
    // Earlier chunks may already be purged; show the trash as it is now.
    if (assetCount) await refreshTrashView();
    return;
  } finally {
    purging.value = false;
  }
  // Nothing to purge means nothing was deleted: the backend removes an empty
  // trashed folder on its own, so say that rather than claim a delete.
  if (!found) {
    purgeOpen.value = false;
    toast({ title: t('asset_library.trashed_folder_empty_note') });
    return;
  }
  purgedIds.value = [...purgedIds.value, target._id];
  purgeOpen.value = false;
  if (selected.value === trashedFolderKey(target._id))
    selected.value = TRASH_KEY;
  backgroundJobs.start({
    spec: { kind: 'purge', assetIds: purged },
    label: {
      key: 'asset_library.job_deleting_folder',
      params: { name: target.name },
    },
    doneMessage: { key: 'entity_deleted', params: { entityKey: 'folder' } },
    doneDescription: assetCount
      ? {
          key: 'asset_library.folder_delete_purge_done',
          params: { count: assetCount },
          plural: assetCount,
        }
      : undefined,
    refreshKeys: [
      'asset-folders',
      'asset-trash-folders',
      'asset-library-list',
      'asset-tags',
    ],
  });
}
</script>

<template>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel
        class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase"
      >
        {{ $t('folder', 2) }}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu v-if="!props.hideAll">
          <SidebarMenuItem>
            <SidebarMenuButton
              :is-active="selected === null"
              @click="selected = null"
            >
              <span class="size-4 shrink-0" />
              <component
                :is="allIcon"
                class="text-muted-foreground"
                aria-hidden="true"
              />
              <span :class="selected === null && 'font-semibold'">
                {{ $t('all_entity', { entityKey: 'asset' }, 2) }}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu :class="{ 'mt-2': !props.hideAll }">
          <template v-if="loading">
            <SidebarMenuItem v-for="n in 4" :key="n">
              <SidebarMenuSkeleton />
            </SidebarMenuItem>
          </template>

          <AssetFolderTreeItem
            v-for="node in tree"
            :key="node._id"
            :node="node"
            :selected="selected"
            :readonly="props.readonly"
            :busy-ids="busyIds"
            :disabled-ids="props.disabledIds"
            :locked-ids="lockedIds"
            @select="selected = $event"
            @create="createFolder"
            @rename="renameFolder"
            @move="requestMove"
            @delete="requestDelete"
          />

          <!-- Not a folder row: the library root (assets with no folder), which
               the API answers as `folderIds: [null]`. -->
          <SidebarMenuItem>
            <SidebarMenuButton
              :is-active="selected === ROOT_FOLDER_KEY"
              :disabled="props.disabledIds?.includes(ROOT_FOLDER_KEY)"
              @click="selected = ROOT_FOLDER_KEY"
            >
              <span class="size-4 shrink-0" />
              <LucideFolderMinus
                class="text-muted-foreground"
                aria-hidden="true"
              />
              <span :class="selected === ROOT_FOLDER_KEY && 'font-semibold'">
                {{ $t('asset_library.uncategorised') }}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <!-- Trash is a separate query (`trashed: true`), and the picker must
               not browse soft-deleted assets — hence `!readonly`. -->
          <SidebarMenuItem v-if="!props.readonly">
            <SidebarMenuButton
              :is-active="selected === TRASH_KEY"
              @click="selected = TRASH_KEY"
            >
              <span class="size-4 shrink-0" />
              <LucideTrash2 class="text-muted-foreground" aria-hidden="true" />
              <span :class="selected === TRASH_KEY && 'font-semibold'">
                {{ $t('asset_library.trash') }}
              </span>
            </SidebarMenuButton>
            <button
              v-if="trashedNodes.length"
              type="button"
              class="text-muted-foreground hover:text-foreground absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded"
              :aria-label="$t(trashOpen ? 'collapse' : 'expand')"
              :aria-expanded="trashOpen"
              @click.stop="trashOpen = !trashOpen"
            >
              <LucideChevronRight
                class="size-3.5 transition-transform"
                :class="trashOpen && 'rotate-90'"
                aria-hidden="true"
              />
            </button>
            <div
              v-if="trashOpen && trashedNodes.length"
              class="border-sidebar-border mt-1 ml-3.5 border-l pl-2.5"
            >
              <SidebarMenu>
                <AssetFolderTreeItem
                  v-for="node in trashedNodes"
                  :key="node._id"
                  :node="node"
                  :selected="selected"
                  trashed
                  :restoring-id="restoringId"
                  @select="selected = $event"
                  @restore="restoreTrashed"
                  @delete="requestPurge"
                />
              </SidebarMenu>
            </div>
          </SidebarMenuItem>

          <template v-if="!props.readonly">
            <SidebarMenuItem v-if="addingTop">
              <AssetFolderCreateInput
                @create="(name) => createFolder({ parentFolderId: null, name })"
                @cancel="addingTop = false"
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                class="text-muted-foreground"
                @click="addingTop = true"
              >
                <span class="size-4 shrink-0" />
                <LucidePlus class="text-muted-foreground" aria-hidden="true" />
                <span>{{ $t('new_entity', { entityKey: 'folder' }) }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </template>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>

  <template v-if="!props.readonly">
    <DialogDelete
      v-model:open="deleteOpen"
      entity-key="folder"
      :loading="deleting"
      :warning-title="
        deleteError
          ? $t('error_deleting_entity', { entityKey: 'folder' })
          : undefined
      "
      :warning-description="deleteError"
      @confirm="confirmDelete"
    />

    <DialogDelete
      v-model:open="purgeOpen"
      entity-key="folder"
      :loading="purging"
      :title="
        $t('asset_library.purge_folder_title', {
          name: purgeTarget?.name ?? '',
        })
      "
      :description="purgeDescription"
      :confirm-label="$t('asset_library.delete_permanently')"
      :warning-title="
        purgeError
          ? $t('error_deleting_entity', { entityKey: 'folder' })
          : undefined
      "
      :warning-description="purgeError"
      @confirm="confirmPurge"
      @cancel="purgeOpen = false"
    />

    <AssetFolderDeleteDialog
      v-model:open="choiceOpen"
      v-model:error="choiceError"
      :folder-name="deleteTarget?.name ?? ''"
      :count="liveCount"
      :loading="deleting"
      @confirm="confirmChoice"
      @cancel="choiceOpen = false"
    />

    <AssetFolderMoveDialog
      v-model:open="moveOpen"
      :folder="moveTarget"
      :loading="!!moveTarget && updatingIds.includes(moveTarget._id)"
      @confirm="confirmMove"
    />
  </template>
</template>
