<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { TabsContent, type TabsContentProps } from 'reka-ui';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TabsContentProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <TabsContent
    data-slot="tabs-content"
    :class="
      cn('ring-offset-background mt-2 flex-1 outline-hidden', props.class)
    "
    v-bind="delegatedProps"
  >
    <slot />
  </TabsContent>
</template>
