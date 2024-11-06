<script lang="ts">
import { defineComponent } from 'vue';
import { File } from 'lucide-vue-next';

export default defineComponent({
  components: {
    File,
  },
});
</script>
<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="secondary">
        <File class="mr-2 size-4" />
        Export list
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <DropdownMenuItem>
        <span>Export all</span>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <span>Export this selection</span>
      </DropdownMenuItem>
      <slot />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
