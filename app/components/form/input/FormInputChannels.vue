<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder?: string;
    /** Optional per-chip class by channel id (e.g. mark a partial bulk selection). */
    itemClass?: (id: string) => string | undefined;
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
    :item-class="itemClass"
    entity-key="channel"
  />
</template>
