<script setup lang="ts">
import { cn } from '@/utils/index';
import {
  PinInputInput,
  type PinInputInputProps,
  useForwardProps,
} from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

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
    :class="cn(props.class)"
  />
</template>
