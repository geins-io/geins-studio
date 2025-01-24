<script setup lang="ts">
const _props = defineProps<{
  linkingWord: string;
  isLast: boolean;
}>();
</script>
<template>
  <div class="flex items-center gap-2">
    <slot />
    <SelectorLinkingWord v-if="!isLast">{{ linkingWord }}</SelectorLinkingWord>
  </div>
</template>
