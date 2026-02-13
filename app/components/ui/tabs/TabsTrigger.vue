<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { TabsTrigger, type TabsTriggerProps, useForwardProps } from 'reka-ui';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TabsTriggerProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    v-bind="forwardedProps"
    :class="
      cn(
        `ring-offset-background focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-foreground focus-visible:border-ring focus-visible:outline-ring text-foreground inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:outline-hidden focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
