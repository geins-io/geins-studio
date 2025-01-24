<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import type { CheckboxRootEmits, CheckboxRootProps } from 'radix-vue';
import {
  CheckboxIndicator,
  CheckboxRoot,
  useForwardPropsEmits,
} from 'radix-vue';
import { CheckIcon } from '@radix-icons/vue';

const props = defineProps<
  CheckboxRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<CheckboxRootEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot
    v-bind="forwarded"
    :class="
      cn(
        'peer size-4 shrink-0 rounded-md border border-primary/50 bg-background !p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:border-primary-foreground/60 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=checked]:text-background',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      class="flex size-full items-center justify-center text-current"
    >
      <slot>
        <CheckIcon class="size-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
