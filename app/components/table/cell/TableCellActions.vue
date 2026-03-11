<script setup lang="ts" generic="T">
const props = withDefaults(
  defineProps<{
    rowData: T;
    availableActions?: TableRowAction[];
    disabledActions?: TableRowAction[] | ((rowData: T) => TableRowAction[]);
  }>(),
  {
    availableActions: () => ['edit', 'copy', 'delete'],
    disabledActions: undefined,
  },
);

const emit = defineEmits({
  edit: (rowData): T => rowData,
  copy: (rowData): T => rowData,
  delete: (rowData): T => rowData,
});

const isDisabled = (action: TableRowAction): boolean => {
  if (!props.disabledActions) return false;
  if (typeof props.disabledActions === 'function') {
    return props.disabledActions(props.rowData).includes(action);
  }
  return props.disabledActions.includes(action);
};
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
          v-if="availableActions.includes('edit')"
          :disabled="isDisabled('edit')"
          @click="emit('edit', rowData)"
        >
          <LucideEdit class="mr-2 size-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="availableActions.includes('copy')"
          :disabled="isDisabled('copy')"
          @click="emit('copy', rowData)"
        >
          <LucideCopy class="mr-2 size-4" />
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-if="availableActions.includes('delete')"
          :disabled="isDisabled('delete')"
          @click="emit('delete', rowData)"
        >
          <LucideTrash class="mr-2 size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
