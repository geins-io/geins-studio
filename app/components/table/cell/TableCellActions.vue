<script setup lang="ts" generic="T">
const _props = defineProps<{
  rowData: T;
}>();

const emit = defineEmits({
  edit: (rowData): T => rowData,
  copy: (rowData): T => rowData,
  unpublish: (rowData): T => rowData,
  delete: (rowData): T => rowData,
});
</script>
<template>
  <div class="flex justify-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button class="size-7 p-1" size="xs" variant="outline">
          <LucideMoreHorizontal class="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="emit('edit', rowData)">
          <LucideEdit class="mr-2 size-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('copy', rowData)">
          <LucideCopy class="mr-2 size-4" />
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('unpublish', rowData)">
          <LucideCircleMinus class="mr-2 size-4" />
          <span>Unpublish</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="emit('delete', rowData)">
          <LucideTrash class="mr-2 size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <!-- <Button
      class="size-7 p-1"
      size="xs"
      variant="outline"
      @click="emit('edit', rowData)"
    >
      <LucideEdit class="size-3.5" />
    </Button> -->
  </div>
</template>
