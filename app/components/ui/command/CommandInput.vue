<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Search } from 'lucide-vue-next';
import {
  ListboxFilter,
  type ListboxFilterProps,
  useForwardProps,
} from 'reka-ui';
import { cn } from '@/lib/utils';
import { useCommand } from '.';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<
  ListboxFilterProps & {
    class?: HTMLAttributes['class'];
    autoFocus?: boolean;
  }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);

const { filterState } = useCommand();
</script>

<template>
  <div
    data-slot="command-input-wrapper"
    class="bg-input focus-within:border-primary flex items-center gap-2 rounded-lg border border-b px-3"
  >
    <Search class="mr-2 size-4 shrink-0" />
    <ListboxFilter
      v-bind="{ ...forwardedProps, ...$attrs }"
      v-model="filterState.search"
      data-slot="command-input"
      :auto-focus="autoFocus"
      :class="
        cn(
          'placeholder:text-muted-foreground bg-input flex h-9 w-full rounded-lg py-1 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
    />
  </div>
</template>
