<script setup lang="ts">
import { Primitive, type PrimitiveProps, useForwardProps } from 'reka-ui';

const props = defineProps<PrimitiveProps>();
const forwardedProps = useForwardProps(props);
</script>

<template>
  <Primitive data-slot="pin-input-separator" v-bind="forwardedProps">
    <slot>
      <LucideMinus class="w-2" />
    </slot>
  </Primitive>
</template>
