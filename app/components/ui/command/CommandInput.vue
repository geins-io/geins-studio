<script setup lang="ts">
import { cn } from '@/utils';
import { Search } from 'lucide-vue-next';
import {
  ListboxFilter,
  type ListboxFilterProps,
  useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';
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

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);

const { filterState } = useCommand();
</script>

<template>
  <div
    class="flex items-center rounded-lg border bg-input px-3 focus-within:border-primary"
    cmdk-input-wrapper
  >
    <Search class="mr-2 size-4 shrink-0" />
    <ListboxFilter
      v-bind="{ ...forwardedProps, ...$attrs }"
      v-model="filterState.search"
      :auto-focus="autoFocus"
      :class="
        cn(
          'flex h-9 w-full rounded-lg bg-input py-1 text-sm transition-colors file:border-0 placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
    />
  </div>
</template>
