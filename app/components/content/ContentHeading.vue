<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
    size?: 's' | 'm' | 'l' | 'xl';
  }>(),
  {
    as: 'p',
    size: 's',
  },
);

const as = ref(props.as);

const classes = computed(() => {
  switch (props.size) {
    case 'l':
      return 'text-3xl font-bold mb-1';
    case 'm':
      return 'text-xl font-semibold mb-1.5';
    default:
      return 'text-sm font-medium mb-1.5';
  }
});
</script>
<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
