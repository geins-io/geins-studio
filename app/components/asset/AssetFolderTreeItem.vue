<script setup lang="ts">
import { trashedFolderKey } from '#shared/utils/asset';
import type { FolderNode } from '@/composables/useFolders';

/**
 * Recursive folder tree row — selectable, expandable. A live row offers add
 * subfolder on hover plus a `⋯` menu: rename (inline), move, delete. A
 * `trashed` row selects its trashed contents and offers restore + delete
 * permanently instead.
 */
const props = defineProps<{
  node: FolderNode;
  selected: string | null;
  /** Selection-only mode: hides the hover actions (picker rail). */
  readonly?: boolean;
  /** Folders whose delete or update is being prepared — their icon spins. */
  busyIds?: string[];
  /** A folder in the trash, listed under Trash. */
  trashed?: boolean;
  /** Folder being restored — its restore icon spins. */
  restoringId?: string | null;
  /** Folders that can't be selected (a move's own subtree, its parent). */
  disabledIds?: string[];
  /** Folders a pending rename/move holds — no rename or move meanwhile. */
  lockedIds?: string[];
  /** Folders a new subfolder is being created in — its row stays meanwhile. */
  creatingIds?: string[];
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [payload: { parentFolderId: string; name: string }];
  rename: [payload: { node: FolderNode; name: string }];
  move: [node: FolderNode];
  delete: [node: FolderNode];
  restore: [node: FolderNode];
}>();

const { resolveIcon } = useLucideIcon();

const hasChildren = computed(() => props.node.children.length > 0);
const open = ref(false);
const addingChild = ref(false);
const renaming = ref(false);
const menuOpen = ref(false);
const selectKey = computed(() =>
  props.trashed ? trashedFolderKey(props.node._id) : props.node._id,
);
const isActive = computed(() => props.selected === selectKey.value);
const busy = computed(() => !!props.busyIds?.includes(props.node._id));
const restoring = computed(() => props.restoringId === props.node._id);
const disabled = computed(() => !!props.disabledIds?.includes(props.node._id));
const locked = computed(() => !!props.lockedIds?.includes(props.node._id));
const creating = computed(() => !!props.creatingIds?.includes(props.node._id));

// A selected descendant (a `?folder=` link, an upload's target folder) opens
// its ancestors so the active row shows. Collapsing it again sticks.
const containsSelected = (node: FolderNode): boolean =>
  node.children.some(
    (child) => child._id === props.selected || containsSelected(child),
  );
watch(
  () => containsSelected(props.node),
  (contains) => {
    if (contains) open.value = true;
  },
  { immediate: true },
);

// Open-folder icon when expanded or active, closed otherwise.
const folderIcon = computed(() =>
  resolveIcon(open.value || isActive.value ? 'FolderOpen' : 'Folder'),
);

function startAddChild() {
  open.value = true;
  addingChild.value = true;
}
// The emit marks this folder `creating` in the same tick, so the new-folder
// row stays mounted (spinning) until the tree's refetch lands.
function onCreateChild(name: string) {
  emit('create', { parentFolderId: props.node._id, name });
  addingChild.value = false;
}

// Rename starts once the menu has closed: on close the menu moves focus back
// to its trigger, which would blur (and so commit) an input mounted earlier.
let renameRequested = false;
function requestRename() {
  renameRequested = true;
}
function onMenuCloseAutoFocus(event: Event) {
  if (!renameRequested) return;
  renameRequested = false;
  event.preventDefault();
  renaming.value = true;
}
function onRename(name: string) {
  emit('rename', { node: props.node, name });
  renaming.value = false;
}
</script>

<template>
  <SidebarMenuItem>
    <AssetFolderCreateInput
      v-if="renaming"
      :initial-value="node.name"
      @create="onRename"
      @cancel="renaming = false"
    />
    <SidebarMenuButton
      v-else
      :is-active="isActive"
      :disabled="disabled"
      @click="emit('select', selectKey)"
    >
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
      v-if="hasChildren && !renaming"
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
         keyboard focus too, not just hover. Hidden in readonly (picker) mode. -->
    <div
      v-if="!readonly && !renaming"
      class="absolute top-1 right-1 flex gap-0.5 opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100"
      :class="(busy || restoring || menuOpen) && 'opacity-100'"
    >
      <template v-if="trashed">
        <button
          type="button"
          class="text-muted-foreground flex size-6 items-center justify-center rounded"
          :class="!restoring && 'hover:bg-sidebar-accent hover:text-foreground'"
          :aria-label="$t('restore')"
          :aria-busy="restoring"
          :disabled="restoring || busy"
          @click.stop="emit('restore', node)"
        >
          <LucideLoaderCircle
            v-if="restoring"
            class="size-3.5 animate-spin"
            aria-hidden="true"
          />
          <LucideUndo2 v-else class="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="text-muted-foreground flex size-6 items-center justify-center rounded"
          :class="!busy && 'hover:bg-sidebar-accent hover:text-destructive'"
          :aria-label="$t('asset_library.delete_permanently')"
          :aria-busy="busy"
          :disabled="busy || restoring"
          @click.stop="emit('delete', node)"
        >
          <LucideLoaderCircle
            v-if="busy"
            class="size-3.5 animate-spin"
            aria-hidden="true"
          />
          <LucideTrash2 v-else class="size-3.5" aria-hidden="true" />
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex size-6 items-center justify-center rounded"
          :aria-label="$t('add_entity', { entityKey: 'folder' })"
          data-test="folder-add-child"
          @click.stop="startAddChild"
        >
          <LucidePlus class="size-3.5" aria-hidden="true" />
        </button>
        <DropdownMenu v-model:open="menuOpen">
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="text-muted-foreground flex size-6 items-center justify-center rounded"
              :class="
                !busy &&
                'hover:bg-sidebar-accent hover:text-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-foreground'
              "
              :aria-label="$t('actions')"
              :aria-busy="busy"
              :disabled="busy"
            >
              <LucideLoaderCircle
                v-if="busy"
                class="size-3.5 animate-spin"
                aria-hidden="true"
              />
              <LucideEllipsis v-else class="size-3.5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            @close-auto-focus="onMenuCloseAutoFocus"
          >
            <DropdownMenuItem :disabled="locked" @select="requestRename">
              <LucidePencil class="mr-2 size-4" aria-hidden="true" />
              <span>{{ $t('rename_entity', { entityKey: 'folder' }) }}</span>
            </DropdownMenuItem>
            <DropdownMenuItem :disabled="locked" @select="emit('move', node)">
              <LucideFolderInput class="mr-2 size-4" aria-hidden="true" />
              <span>{{ $t('move_entity', { entityKey: 'folder' }) }}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <!-- Not locked: during a move the backend refuses the delete with
                 MOVE_PENDING, which the delete dialog shows in friendly copy. -->
            <DropdownMenuItem @select="emit('delete', node)">
              <LucideTrash2 class="mr-2 size-4" aria-hidden="true" />
              <span>{{ $t('delete_entity', { entityKey: 'folder' }) }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </div>

    <div
      v-if="(hasChildren && open) || addingChild || creating"
      class="border-sidebar-border mt-1 ml-3.5 border-l pl-2.5"
    >
      <SidebarMenu>
        <SidebarMenuItem v-if="addingChild || creating">
          <AssetFolderCreateInput
            @create="onCreateChild"
            @cancel="addingChild = false"
          />
        </SidebarMenuItem>
        <AssetFolderTreeItem
          v-for="child in node.children"
          :key="child._id"
          :node="child"
          :selected="selected"
          :readonly="readonly"
          :busy-ids="busyIds"
          :trashed="trashed"
          :restoring-id="restoringId"
          :disabled-ids="disabledIds"
          :locked-ids="lockedIds"
          :creating-ids="creatingIds"
          @select="emit('select', $event)"
          @create="emit('create', $event)"
          @rename="emit('rename', $event)"
          @move="emit('move', $event)"
          @delete="emit('delete', $event)"
          @restore="emit('restore', $event)"
        />
      </SidebarMenu>
    </div>
  </SidebarMenuItem>
</template>
