<script lang="ts">
import { defineComponent } from 'vue';
import { Save } from 'lucide-vue-next';

export default defineComponent({
  components: {
    Save,
  },
});
</script>

<template>
  <Button>
    <Save class="mr-2 size-4" />
    <slot />
  </Button>
</template>
