<script lang="ts">
import { defineComponent } from 'vue';
import { Copy } from 'lucide-vue-next';

export default defineComponent({
  components: {
    Copy,
  },
});
</script>

<template>
  <Button>
    <Copy class="mr-2 size-4" />
    <slot />
  </Button>
</template>
