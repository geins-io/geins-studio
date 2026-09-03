<script setup lang="ts">
import type { FolderNode } from '@/composables/useFolders';

/** Recursive folder tree row — selectable, expandable, with hover add/delete. */
const props = defineProps<{
  node: FolderNode;
  selected: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [payload: { parentFolderId: string; name: string }];
  delete: [node: FolderNode];
}>();

const { resolveIcon } = useLucideIcon();

const hasChildren = computed(() => props.node.children.length > 0);
const open = ref(false);
const addingChild = ref(false);
const isActive = computed(() => props.selected === props.node._id);

// Open-folder icon when expanded or active, closed otherwise.
const folderIcon = computed(() =>
  resolveIcon(open.value || isActive.value ? 'FolderOpen' : 'Folder'),
);

function startAddChild() {
  open.value = true;
  addingChild.value = true;
}
function onCreateChild(name: string) {
  emit('create', { parentFolderId: props.node._id, name });
  addingChild.value = false;
}
</script>

<template>
  <SidebarMenuItem>
    <SidebarMenuButton :is-active="isActive" @click="emit('select', node._id)">
      <!-- Reserved leading slot; the chevron toggle (below) overlays it so the
           row button holds no nested interactive element. -->
      <span class="size-4 shrink-0" aria-hidden="true" />
      <component
        :is="folderIcon"
        class="text-muted-foreground"
        aria-hidden="true"
      />
      <span class="truncate" :class="isActive && 'font-semibold'">
        {{ node.name }}
      </span>
    </SidebarMenuButton>

    <!-- Expand toggle: a real, focusable button (sibling of the row button, not
         nested) overlaid on the reserved leading slot, so keyboard users can
         expand/collapse and AT gets aria-expanded. -->
    <button
      v-if="hasChildren"
      type="button"
      class="text-muted-foreground hover:text-foreground absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded"
      :aria-label="$t(open ? 'collapse' : 'expand')"
      :aria-expanded="open"
      @click.stop="open = !open"
    >
      <LucideChevronRight
        class="size-3.5 transition-transform"
        :class="open && 'rotate-90'"
        aria-hidden="true"
      />
    </button>

    <!-- Hover actions (siblings of the row button, not nested); reveal on
         keyboard focus too, not just hover. -->
    <div
      class="absolute top-1 right-1 flex gap-0.5 opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100"
    >
      <button
        type="button"
        class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex size-6 items-center justify-center rounded"
        :aria-label="$t('add_entity', { entityKey: 'folder' })"
        @click.stop="startAddChild"
      >
        <LucidePlus class="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="text-muted-foreground hover:bg-sidebar-accent hover:text-destructive flex size-6 items-center justify-center rounded"
        :aria-label="$t('delete_entity', { entityKey: 'folder' })"
        @click.stop="emit('delete', node)"
      >
        <LucideTrash2 class="size-3.5" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="(hasChildren && open) || addingChild"
      class="border-sidebar-border mt-1 ml-3.5 border-l pl-2.5"
    >
      <SidebarMenu>
        <AssetFolderCreateInput
          v-if="addingChild"
          @create="onCreateChild"
          @cancel="addingChild = false"
        />
        <AssetFolderTreeItem
          v-for="child in node.children"
          :key="child._id"
          :node="child"
          :selected="selected"
          @select="emit('select', $event)"
          @create="emit('create', $event)"
          @delete="emit('delete', $event)"
        />
      </SidebarMenu>
    </div>
  </SidebarMenuItem>
</template>
