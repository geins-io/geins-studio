<script setup lang="ts">
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

const { tree, systemFolders, loading, refresh } = useFolders();
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
const deleting = ref(false);

function requestDelete(node: FolderNode) {
  deleteTarget.value = node;
  deleteOpen.value = true;
}
async function confirmDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await assetApi.folder.delete(deleteTarget.value._id);
    await refresh();
    toast({
      title: t('entity_deleted', { entityKey: 'folder' }),
      variant: 'positive',
    });
    deleteOpen.value = false;
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
              <component :is="allIcon" class="text-muted-foreground" />
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
              <LucidePlus class="text-muted-foreground" />
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
</template>
