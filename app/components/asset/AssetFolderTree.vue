<script setup lang="ts">
/**
 * Folder navigation tree (shadcn Sidebar). A "Folders" header, then "All assets"
 * with a little space, the nested user folders, and the locked system folders
 * (Uncategorised / Archived) following inline. Selection is emitted via
 * `v-model:selected` (folder id, or `null` for All); the page turns that into
 * the server-side `folderId` filter. Must be used inside a
 * `SidebarProvider` / `Sidebar` (the library page provides it).
 */
const selected = defineModel<string | null>('selected', { default: null });

const { tree, systemFolders, loading } = useFolders();
const { resolveIcon } = useLucideIcon();

const systemIcon = (name: string) =>
  resolveIcon(/archiv|arkiv/i.test(name) ? 'Archive' : 'FolderMinus');
</script>

<template>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>{{ $t('folder', 2) }}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              :is-active="selected === null"
              @click="selected = null"
            >
              <LucideFolder />
              <span>{{ $t('all_entity', { entityKey: 'asset' }, 2) }}</span>
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
          />
          <SidebarMenuItem v-for="sys in systemFolders" :key="sys._id">
            <SidebarMenuButton
              :is-active="selected === sys._id"
              @click="selected = sys._id"
            >
              <component :is="systemIcon(sys.name)" />
              <span>{{ sys.name }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</template>
