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

const title = toRef(props, 'title');
const description = toRef(props, 'description');
const unsavedChanges = toRef(props, 'unsavedChanges');
</script>

<template>
  <div class="content-title-block">
    <div class="flex items-center">
      <h1 class="text-2xl font-bold md:mb-1 md:text-3xl">
        {{ title }}
      </h1>
      <span v-show="unsavedChanges">Unsaved changes</span>
    </div>
    <p v-if="description" class="text-sm">
      {{ description }}
    </p>
  </div>
</template>
