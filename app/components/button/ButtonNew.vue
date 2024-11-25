<script setup lang="ts">
import { Plus } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    href?: string;
  }>(),
  {
    href: '',
  },
);

const link = resolveComponent('NuxtLink');
const elem = props.href ? link : 'div';
</script>
<template>
  <Button as-child>
    <component :is="elem" :to="href" class="flex">
      <Plus class="mr-2 size-4" />
      <slot />
    </component>
  </Button>
</template>
