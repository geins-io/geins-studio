<script setup lang="ts">
import type { EntityBaseWithName } from '#shared/types';

withDefaults(
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

const { languages } = storeToRefs(useAccountStore());

// Stored values are free labels, so another client may have written one the
// account doesn't have. Append it as its uppercased code so the chip still
// renders; it never shows as an option since selected ids are filtered out.
const dataSet = computed<EntityBaseWithName[]>(() => {
  const known = new Set(languages.value.map((lang) => lang._id));
  return [
    ...languages.value,
    ...model.value
      .filter((code) => !known.has(code))
      .map((code) => ({ _id: code, name: code.toUpperCase() })),
  ];
});
</script>

<template>
  <FormInputTagsSearch
    v-model="model"
    :data-set="dataSet"
    :placeholder="placeholder"
    entity-key="language"
  >
    <template #item="{ item }">
      <span class="flex-1">{{ item.name }}</span>
      <span class="text-muted-foreground text-xs uppercase">
        {{ item._id }}
      </span>
    </template>
  </FormInputTagsSearch>
</template>
