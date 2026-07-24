<script setup lang="ts">
import type { FolderNode } from '@/composables/useFolders';

/** Recursive folder tree row — selectable; a leading chevron expands children. */
const props = defineProps<{
  node: FolderNode;
  selected: string | null;
}>();

const emit = defineEmits<{ select: [id: string] }>();

const { resolveIcon } = useLucideIcon();

const hasChildren = computed(() => props.node.children.length > 0);
const open = ref(false);
const isActive = computed(() => props.selected === props.node._id);

// Open-folder icon when expanded or active, closed otherwise.
const folderIcon = computed(() =>
  resolveIcon(open.value || isActive.value ? 'FolderOpen' : 'Folder'),
);
</script>

<template>
  <SidebarMenuItem>
    <SidebarMenuButton :is-active="isActive" @click="emit('select', node._id)">
      <!-- chevron before the folder icon; a span (not a button) so it can live
           inside the button without invalid nesting -->
      <span
        v-if="hasChildren"
        class="-ml-1 flex size-4 shrink-0 items-center justify-center"
        :aria-label="$t('expand')"
        @click.stop="open = !open"
      >
        <LucideChevronRight
          class="size-3.5 transition-transform"
          :class="open && 'rotate-90'"
        />
      </span>
      <span v-else class="size-4 shrink-0" />
      <component :is="folderIcon" class="text-muted-foreground" />
      <span class="truncate" :class="isActive && 'font-semibold'">
        {{ node.name }}
      </span>
    </SidebarMenuButton>

    <div
      v-if="hasChildren && open"
      class="border-sidebar-border mt-1 ml-3.5 border-l pl-2.5"
    >
      <SidebarMenu>
        <AssetFolderTreeItem
          v-for="child in node.children"
          :key="child._id"
          :node="child"
          :selected="selected"
          @select="emit('select', $event)"
        />
      </SidebarMenu>
    </div>
  </SidebarMenuItem>
</template>
