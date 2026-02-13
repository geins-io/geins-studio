<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { TabsList, type TabsListProps } from 'reka-ui';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TabsListProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-secondary text-secondary-foreground inline-flex w-auto items-center justify-center rounded-lg p-1',
        props.class,
      )
    "
  >
    <slot />
  </TabsList>
</template>
