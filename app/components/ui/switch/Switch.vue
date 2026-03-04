<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import {
  SwitchRoot,
  type SwitchRootEmits,
  type SwitchRootProps,
  SwitchThumb,
  useForwardPropsEmits,
} from 'reka-ui';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  SwitchRootProps & { class?: HTMLAttributes['class'] }
>();

const emits = defineEmits<SwitchRootEmits>();

const delegatedProps = reactiveOmit(props, 'class');

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SwitchRoot
    data-slot="switch"
    v-bind="forwarded"
    :class="
      cn(
        'peer data-[state=checked]:bg-positive data-[state=unchecked]:bg-border focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs outline-hidden transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <SwitchThumb
      data-slot="switch-thumb"
      :class="
        cn(
          'bg-card dark:data-[state=unchecked]:bg-foreground dark:bg-primary pointer-events-none block size-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-4px)] data-[state=unchecked]:translate-x-0',
        )
      "
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
