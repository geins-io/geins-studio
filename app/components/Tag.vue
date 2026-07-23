<script setup lang="ts">
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/index';

/**
 * Shared read-only tag pill — the bordered-pill look used across Selector,
 * table cells, and cards. `default` matches the Selector/table size (with the
 * Selector's `@2xl` bump); `sm` is the tighter card size. Optionally removable.
 *
 * This is for DISPLAY tags — not the editable `ui/tags-input` form primitive.
 * Coloring/status stays on `Badge`.
 */
withDefaults(
  defineProps<{
    label?: string;
    size?: 'sm' | 'default';
    removable?: boolean;
  }>(),
  { size: 'default', removable: false },
);

const emit = defineEmits<{ remove: [] }>();

const tagVariants = cva(
  'bg-background inline-flex items-center gap-1 border whitespace-nowrap',
  {
    variants: {
      size: {
        default:
          'rounded-lg px-2 py-1 text-xs leading-4 @2xl:px-3 @2xl:py-1.5 @2xl:text-sm',
        sm: 'rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium',
      },
    },
    defaultVariants: { size: 'default' },
  },
);
</script>

<template>
  <div :class="cn(tagVariants({ size }))">
    <slot>{{ label }}</slot>
    <Button
      v-if="removable"
      type="ghost"
      size="xs"
      class="text-foreground hover:text-negative ml-1 size-3 bg-transparent p-0 hover:bg-transparent"
      @click="emit('remove')"
    >
      <LucideX class="size-3" />
    </Button>
  </div>
</template>
