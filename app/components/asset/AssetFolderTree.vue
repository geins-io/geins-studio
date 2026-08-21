<script setup lang="ts">
import type { FolderDeleteAssets } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import type { FolderNode } from '@/composables/useFolders';

/**
 * Folder navigation tree (shadcn Sidebar). "Folders" header, then "All assets",
 * the nested user folders (create subfolder / delete on hover), the locked
 * system folders, and a "New folder" action. Selection via `v-model:selected`
 * (folder id, or `null` for All) drives the server-side `folderId` filter.
 * Must be used inside a `SidebarProvider` / `Sidebar`.
 */
const selected = defineModel<string | null>('selected', { default: null });

const { tree, systemFolders, loading, refresh, descendantIds } = useFolders();
const { assetApi } = useGeinsRepository();
const { resolveIcon } = useLucideIcon();
const { toast } = useToast();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog('components/AssetFolderTree.vue');

const systemIcon = (name: string) =>
  resolveIcon(/archiv|arkiv/i.test(name) ? 'Archive' : 'FolderMinus');
const allIcon = computed(() =>
  resolveIcon(selected.value === null ? 'FolderOpenDot' : 'FolderDot'),
);

const addingTop = ref(false);

async function createFolder(payload: {
  parentId: string | null;
  name: string;
}) {
  try {
    await assetApi.folder.create({
      name: payload.name,
      parentId: payload.parentId,
      sortOrder: 0,
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

// Empty folders get the plain confirm; folders that (with their subtree) still
// hold assets get the choice dialog. `list({ folderId })` already returns the
// folder + descendants (server-side), so its length is the subtree count.
async function requestDelete(node: FolderNode) {
  deleteTarget.value = node;
  try {
    const assets = await assetApi.list({ folderId: node._id });
    pendingCount.value = Array.isArray(assets) ? assets.length : 0;
  } catch {
    pendingCount.value = 0;
  }
  if (pendingCount.value > 0) choiceOpen.value = true;
  else deleteOpen.value = true;
}

async function confirmDelete(assets: FolderDeleteAssets = 'move') {
  if (!deleteTarget.value) return;
  const removed = descendantIds(deleteTarget.value._id);
  deleting.value = true;
  try {
    await assetApi.deleteFolder(deleteTarget.value._id, assets);
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
            @select="selected = $event"
            @create="createFolder"
            @delete="requestDelete"
          />

          <SidebarMenuItem v-for="sys in systemFolders" :key="sys._id">
            <SidebarMenuButton
              :is-active="selected === sys._id"
              @click="selected = sys._id"
            >
              <span class="size-4 shrink-0" />
              <component
                :is="systemIcon(sys.name)"
                class="text-muted-foreground"
                aria-hidden="true"
              />
              <span :class="selected === sys._id && 'font-semibold'">
                {{ sys.name }}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <AssetFolderCreateInput
            v-if="addingTop"
            @create="(name) => createFolder({ parentId: null, name })"
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
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>

  <DialogDelete
    v-model:open="deleteOpen"
    entity-key="folder"
    :loading="deleting"
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
