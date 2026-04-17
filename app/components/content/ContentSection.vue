<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: string;
    size?: 'sm' | 'md' | 'lg';
    headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }>(),
  {
    size: 'md',
  },
);
</script>

<template>
  <ContentCard class="@2xl:p-5">
    <div class="space-y-4">
      <ContentCardHeader
        :title="title"
        :description="description"
        :icon="icon"
        :size="size"
        :heading-level="headingLevel"
      />
      <slot />
    </div>
  </ContentCard>
</template>
