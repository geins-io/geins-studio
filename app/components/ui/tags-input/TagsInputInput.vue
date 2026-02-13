<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import {
  TagsInputInput,
  type TagsInputInputProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TagsInputInputProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <TagsInputInput
    v-bind="forwardedProps"
    :class="
      cn(
        'placeholder:text-muted-foreground min-h-5 flex-1 bg-transparent px-1 text-sm focus:outline-hidden',
        props.class,
      )
    "
  />
</template>
