<script setup lang="ts">
const _props = defineProps<{
  channelIds: string[];
}>();

const accountStore = useAccountStore();
const { channels } = storeToRefs(accountStore);
const getChannelName = (channelId: string) => {
  const channel = channels.value.find((channel) => channel._id === channelId);
  return channel ? channel.name : '';
};
</script>
<template>
  <div>
    <span v-for="(channelId, index) in channelIds" :key="channelId">
      {{ getChannelName(channelId)
      }}<span v-if="index < channelIds.length - 1">,&nbsp;</span>
    </span>
  </div>
</template>
