<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import {
  TagsInputItemText,
  type TagsInputItemTextProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '@/utils/index';

const props = defineProps<
  TagsInputItemTextProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TagsInputItemText
    v-bind="forwardedProps"
    :class="cn('rounded bg-transparent px-2 py-0.5 text-sm', props.class)"
  />
</template>
