<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import {
  PinInputInput,
  type PinInputInputProps,
  useForwardProps,
} from 'radix-vue';
import { cn } from '@/lib/utils';

const props = defineProps<
  PinInputInputProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);

const pinInput = ref<typeof PinInputInput | null>(null);

onMounted(() => {
  const el = pinInput.value?.$el;
  if (props.index === 0 && el instanceof HTMLInputElement) {
    el.focus();
  }
});
</script>

<template>
  <PinInputInput
    ref="pinInput"
    v-bind="forwardedProps"
    :class="
      cn(
        'relative text-center bg-transparent focus:outline-none focus:ring-1 focus:ring-ring focus:relative focus:z-10 flex size-16 items-center justify-center border-y border-r border-input text-lg transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        props.class,
      )
    "
  />
</template>
~/app/lib/utils
