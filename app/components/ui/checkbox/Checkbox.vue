<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/index';
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  CheckboxRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<CheckboxRootEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot
    v-slot="{ state }"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn(
        'peer data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-5 shrink-0 rounded-md border bg-white p-0! shadow-xs outline-hidden transition-shadow focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="flex size-full items-center justify-center text-current transition-none"
    >
      <slot>
        <LucideMinus
          v-if="state === 'indeterminate'"
          class="size-3.5 text-current transition-colors"
        />
        <LucideCheck v-else class="size-3.5 text-current transition-colors" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
