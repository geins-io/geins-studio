<script setup lang="ts">
import type { FolderDeleteAssets } from '#shared/types';
import { ROOT_FOLDER_KEY, TRASH_KEY } from '#shared/utils/asset';
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
 */
const props = defineProps<{ readonly?: boolean }>();

const selected = defineModel<string | null>('selected', { default: null });

const { tree, loading, refresh, descendantIds } = useFolders();
const { assetApi } = useGeinsRepository();
const caps = useAssetCapabilities();
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
const pendingCount = ref(0);
const deleting = ref(false);
// Inline failure shown inside the plain confirm (the call suppresses the global
// toast so the reason sits next to the button that triggered it). `notEmpty`
// is the expected 409 FOLDER_NOT_EMPTY; `failed` is anything else.
const notEmpty = ref(false);
const failed = ref(false);

// Empty-only backends decide emptiness themselves (409), so skip the probe and
// go straight to the plain confirm — no disposition to offer. Otherwise: empty
// folders get the plain confirm, folders that (with their subtree) still hold
// assets get the choice dialog. `list({ folderId })` already returns the folder
// + descendants (server-side), so its length is the subtree count.
async function requestDelete(node: FolderNode) {
  deleteTarget.value = node;
  notEmpty.value = false;
  failed.value = false;
  if (!caps.canDeleteFolderWithAssets) {
    pendingCount.value = 0;
    deleteOpen.value = true;
    return;
  }
  try {
    const assets = await assetApi.list({ folderId: node._id });
    pendingCount.value = Array.isArray(assets) ? assets.length : 0;
  } catch {
    pendingCount.value = 0;
  }
  if (pendingCount.value > 0) choiceOpen.value = true;
  else deleteOpen.value = true;
}

// Callout inside the plain confirm: why the last attempt didn't go through.
const deleteWarning = computed(() => {
  if (notEmpty.value)
    return {
      title: t('asset_library.folder_not_empty_title'),
      description: t('asset_library.folder_not_empty_description'),
    };
  if (failed.value)
    return {
      title: t('error_deleting_entity', { entityKey: 'folder' }),
      description: t('error_try_again'),
    };
  return undefined;
});

async function confirmDelete(assets: FolderDeleteAssets = 'move') {
  if (!deleteTarget.value) return;
  const removed = descendantIds(deleteTarget.value._id);
  deleting.value = true;
  notEmpty.value = false;
  failed.value = false;
  try {
    if (caps.canDeleteFolderWithAssets) {
      await assetApi.deleteFolder(deleteTarget.value._id, assets);
    } else {
      // Empty-only delete: no `?assets` disposition, and the failure is shown
      // inline rather than as the global toast.
      await assetApi.folder.delete(deleteTarget.value._id, {
        suppressErrorToast: true,
      });
    }
    await refresh();
    await refreshNuxtData('asset-library-list');
    // Deleting the active folder (or an ancestor of it) drops the filter target.
    if (selected.value && removed.includes(selected.value)) {
      selected.value = null;
    }
    toast({
      title: t('entity_deleted', { entityKey: 'folder' }),
      variant: 'positive',
    });
    deleteOpen.value = false;
    choiceOpen.value = false;
  } catch (error) {
    geinsLogError('deleteFolder', getErrorMessage(error));
    if (!caps.canDeleteFolderWithAssets) {
      // 409 is the route's only conflict: the folder still holds assets.
      if (getErrorStatus(error) === 409) notEmpty.value = true;
      else failed.value = true;
    }
  } finally {
    deleting.value = false;
  }
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
        <SidebarMenu>
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

        <SidebarMenu class="mt-2">
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
      :warning-title="deleteWarning?.title"
      :warning-description="deleteWarning?.description"
      @confirm="confirmDelete"
    />

    <AssetFolderDeleteDialog
      v-model:open="choiceOpen"
      :folder-name="deleteTarget?.name ?? ''"
      :count="pendingCount"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="choiceOpen = false"
    />
  </template>
</template>
