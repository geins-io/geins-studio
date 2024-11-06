<script lang="ts">
import { defineComponent } from 'vue';
import { Plus } from 'lucide-vue-next';

export default defineComponent({
  components: {
    Plus,
  },
});
</script>
<template>
  <Button>
    <Plus class="mr-2 size-4" />
    <slot />
  </Button>
</template>
