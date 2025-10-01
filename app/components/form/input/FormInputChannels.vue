<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: '',
  },
);

const model = defineModel<string[]>({
  default: () => [],
});

const accountStore = useAccountStore();
const { channels } = storeToRefs(accountStore);
</script>

<template>
  <FormInputTagsSearch
    v-model="model"
    :data-set="channels"
    :placeholder="placeholder"
    entity-name="channel"
  />
</template>
