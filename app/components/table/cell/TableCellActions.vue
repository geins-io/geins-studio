<script setup lang="ts" generic="T">
import {
  Edit,
  MoreHorizontal,
  Copy,
  CircleMinus,
  Trash,
} from 'lucide-vue-next';

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
          <MoreHorizontal class="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem @click="emit('edit', rowData)">
          <Edit class="mr-2 size-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('copy', rowData)">
          <Copy class="mr-2 size-4" />
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem @click="emit('unpublish', rowData)">
          <CircleMinus class="mr-2 size-4" />
          <span>Unpublish</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="emit('delete', rowData)">
          <Trash class="mr-2 size-4" />
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
      <Edit class="size-3.5" />
    </Button> -->
  </div>
</template>
