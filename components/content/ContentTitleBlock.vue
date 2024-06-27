<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    unsavedChanges?: boolean;
  }>(),
  {
    unsavedChanges: false,
  },
);

const title = ref(props.title);
const description = ref(props.description);
const unsavedChanges = ref(props.unsavedChanges);
</script>

<template>
  <div class="mb-5">
    <div class="flex items-center">
      <h1 class="text-3xl font-bold mb-1">
        {{ title }}
      </h1>
      <span v-show="unsavedChanges">Unsaved changes</span>
    </div>
    <p v-if="description">
      {{ description }}
    </p>
  </div>
</template>
