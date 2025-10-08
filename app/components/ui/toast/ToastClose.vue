<script setup lang="ts">
import { cn } from '@/utils/index';
import { X } from 'lucide-vue-next';
import { ToastClose, type ToastCloseProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = defineProps<
  ToastCloseProps & {
    class?: HTMLAttributes['class'];
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ToastClose
    v-bind="delegatedProps"
    :class="
      cn(
        'text-foreground/50 hover:text-foreground absolute top-1 right-1 rounded-lg p-1 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:group-[.destructive]:text-red-50 focus:opacity-100 focus:ring-1 focus:outline-hidden focus:group-[.destructive]:ring-red-400 focus:group-[.destructive]:ring-offset-red-600',
        props.class,
      )
    "
  >
    <X class="size-4" />
  </ToastClose>
</template>
