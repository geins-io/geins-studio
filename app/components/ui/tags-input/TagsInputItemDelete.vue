<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import {
  TagsInputItemDelete,
  type TagsInputItemDeleteProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TagsInputItemDeleteProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TagsInputItemDelete
    v-bind="forwardedProps"
    :class="cn('mr-1 flex rounded bg-transparent', props.class)"
  >
    <slot>
      <LucideX class="size-4" />
    </slot>
  </TagsInputItemDelete>
</template>
