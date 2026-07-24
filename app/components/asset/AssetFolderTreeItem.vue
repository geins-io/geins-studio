<script setup lang="ts">
import type { FolderNode } from '@/composables/useFolders';

/** Recursive folder tree row — selectable, with a chevron to expand children. */
const props = defineProps<{
  node: FolderNode;
  selected: string | null;
}>();

const emit = defineEmits<{ select: [id: string] }>();

const hasChildren = computed(() => props.node.children.length > 0);
const open = ref(false);
</script>

<template>
  <SidebarMenuItem>
    <SidebarMenuButton
      :is-active="selected === node._id"
      @click="emit('select', node._id)"
    >
      <LucideFolder />
      <span class="truncate">{{ node.name }}</span>
    </SidebarMenuButton>

    <template v-if="hasChildren">
      <SidebarMenuAction
        class="transition-transform"
        :class="open && 'rotate-90'"
        @click="open = !open"
      >
        <LucideChevronRight />
        <span class="sr-only">{{ $t('expand') }}</span>
      </SidebarMenuAction>
      <div
        v-if="open"
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
    </template>
  </SidebarMenuItem>
</template>
