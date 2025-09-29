<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    size?: 'lg' | 'md' | 'sm';
    headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }>(),
  {
    size: 'lg',
    headingLevel: 'h2',
  },
);

const headerClasses = ref('');
const descriptionClasses = ref('');

switch (props.size) {
  case 'md':
    headerClasses.value = 'text-sm sm:text-base';
    descriptionClasses.value = 'text-xs sm:text-sm';
    break;
  case 'sm':
    headerClasses.value = 'text-sm ';
    descriptionClasses.value = 'text-xs sm:mt-1';
    break;
  case 'lg':
  default:
    headerClasses.value = 'text-md sm:text-xl';
    descriptionClasses.value = 'text-xs sm:text-sm sm:mt-1';
}
</script>
<template>
  <div class="text-left">
    <component :is="headingLevel" :class="cn('font-semibold', headerClasses)">
      {{ title }}
    </component>
    <p
      v-if="description"
      :class="cn('text-muted-foreground', descriptionClasses)"
    >
      {{ description }}
    </p>
  </div>
</template>
