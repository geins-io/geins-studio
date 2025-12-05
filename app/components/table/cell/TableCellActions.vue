<script setup lang="ts" generic="T">
const _props = withDefaults(
  defineProps<{
    rowData: T;
    availableActions?: TableRowAction[];
  }>(),
  {
    availableActions: () => ['edit', 'copy', 'delete'],
  },
);

const emit = defineEmits({
  edit: (rowData): T => rowData,
  copy: (rowData): T => rowData,
  delete: (rowData): T => rowData,
  replay: (rowData): T => rowData,
  logs: (rowData): T => rowData,
  pause: (rowData): T => rowData,
});
</script>
<template>
  <div class="flex justify-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button class="size-6 p-1 sm:size-7" size="xs" variant="outline">
          <LucideMoreHorizontal class="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          v-if="availableActions.includes('replay')"
          @click="emit('replay', rowData)"
        >
          <LucideRotateCcw class="mr-2 size-4" />
          <span>Replay</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="availableActions.includes('logs')"
          @click="emit('logs', rowData)"
        >
          <LucideFileText class="mr-2 size-4" />
          <span>Logs</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="availableActions.includes('pause')"
          @click="emit('pause', rowData)"
        >
          <LucidePauseCircle class="mr-2 size-4" />
          <span>Pause</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="availableActions.includes('edit')"
          @click="emit('edit', rowData)"
        >
          <LucideEdit class="mr-2 size-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="availableActions.includes('copy')"
          @click="emit('copy', rowData)"
        >
          <LucideCopy class="mr-2 size-4" />
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-if="availableActions.includes('delete')"
          @click="emit('delete', rowData)"
        >
          <LucideTrash class="mr-2 size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
