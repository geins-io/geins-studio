<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { TabsRoot, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/utils/index';
import type { TabsRootEmits, TabsRootProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TabsRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<TabsRootEmits>();

const delegatedProps = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <TabsRoot data-slot="tabs" v-bind="forwarded" :class="cn('', props.class)">
    <slot />
  </TabsRoot>
</template>
