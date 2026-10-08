<script setup lang="ts">
import type { FolderDeleteAction, FolderDeletion } from '#shared/types';
import {
  FOLDER_DELETE_MAX,
  ROOT_FOLDER_KEY,
  TRASH_KEY,
  folderDeleteFailure,
} from '#shared/utils/asset';
import { useToast } from '@/components/ui/toast/use-toast';
import type { FolderNode } from '@/composables/useFolders';

/**
 * Folder navigation tree (shadcn Sidebar). "Folders" header, then "All assets",
 * the nested folders (create subfolder / delete on hover), the pinned
 * "Uncategorised" and "Trash" views, and a "New folder" action. Selection via
 * `v-model:selected` — a folder id, `null` for All, `ROOT_FOLDER_KEY` for
 * Uncategorised (assets with no folder), or `TRASH_KEY` for the soft-deleted
 * ones — drives the server-side query.
 * Must be used inside a `SidebarProvider` / `Sidebar`.
 *
 * `readonly` makes the rail selection-only — every folder mutation control
 * (hover create/delete, "New folder", delete dialogs) is gated off. Used by the
 * asset picker, where folder management must stay on the library page.
 * `hideAll` drops "All assets" for a destination picker (e.g. bulk move), where
 * it isn't a place an asset can go.
 */
const props = defineProps<{ readonly?: boolean; hideAll?: boolean }>();

const selected = defineModel<string | null>('selected', { default: null });

const { tree, loading, refresh, descendantIds } = useFolders();
const { assetApi } = useGeinsRepository();
const { resolveIcon } = useLucideIcon();
const { toast } = useToast();
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
    await refreshNuxtData(['asset-library-list', 'asset-tags']);
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

// relocate + purge answer 202 and settle in the background, so the one refetch
// can still show assets in their old place (relocate) or in trash (purge).
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
  toast({
    title: t(DELETION_TOAST[action], { entityKey: 'folder' }),
    description: assetCount
      ? t(
          `asset_library.folder_delete_${action}_done`,
          { count: assetCount },
          assetCount,
        )
      : undefined,
    variant: 'positive',
  });
  await afterDelete(removed);
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
            :busy-id="inspectingId"
            @select="selected = $event"
            @create="createFolder"
            @delete="requestDelete"
          />

          <!-- Not a folder row: the library root (assets with no folder), which
               the API answers as `folderIds: [null]`. -->
          <SidebarMenuItem>
            <SidebarMenuButton
              :is-active="selected === ROOT_FOLDER_KEY"
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
          </SidebarMenuItem>

          <template v-if="!props.readonly">
            <AssetFolderCreateInput
              v-if="addingTop"
              @create="(name) => createFolder({ parentFolderId: null, name })"
              @cancel="addingTop = false"
            />
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

    <AssetFolderDeleteDialog
      v-model:open="choiceOpen"
      v-model:error="choiceError"
      :folder-name="deleteTarget?.name ?? ''"
      :count="liveCount"
      :loading="deleting"
      @confirm="confirmChoice"
      @cancel="choiceOpen = false"
    />
  </template>
</template>
