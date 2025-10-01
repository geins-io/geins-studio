<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    link: string;
    linkType: 'create' | 'list';
  }>(),
  {
    title: 'Card Title',
    description: 'Card Description',
    link: '#',
    linkType: 'list',
  },
);
</script>
<template>
  <NuxtLink :to="props.link">
    <Card class="hover:border-primary/20 cursor-pointer p-6 transition-colors">
      <div class="flex items-center justify-between gap-3 pr-1">
        <ContentCardHeader
          :title="props.title"
          :description="props.description"
          size="md"
        />
        <LucideChevronRight
          v-if="props.linkType === 'list'"
          class="size-5 flex-shrink-0"
        />
        <LucidePlus v-else class="size-5 flex-shrink-0" />
      </div>
    </Card>
  </NuxtLink>
</template>
