<script setup lang="ts">
const _props = defineProps<{
  channelIds: string[];
}>();

const accountStore = useAccountStore();
</script>
<template>
  <div>
    <span v-for="(channelId, index) in channelIds" :key="channelId">
      {{ accountStore.getChannelNameById(channelId)
      }}<span v-if="index < channelIds.length - 1">,&nbsp;</span>
    </span>
  </div>
</template>
