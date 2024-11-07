<script setup lang="ts">
import {
  Edit,
  MoreHorizontal,
  Copy,
  CircleMinus,
  Trash,
} from 'lucide-vue-next';

const emit = defineEmits({
  edit: (): boolean => true,
  more: (): boolean => true,
});
// Import icons edit and delete from lucile-vue-next
</script>
<template>
  <div class="flex justify-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          class="size-7 p-1"
          size="xs"
          variant="outline"
          @click="emit('more')"
        >
          <MoreHorizontal class="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <Edit class="mr-2 size-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy class="mr-2 size-4" />
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CircleMinus class="mr-2 size-4" />
          <span>Unpublish</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Trash class="mr-2 size-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Button
      class="size-7 p-1"
      size="xs"
      variant="outline"
      @click="emit('edit')"
    >
      <Edit class="size-3.5" />
    </Button>
  </div>
</template>
