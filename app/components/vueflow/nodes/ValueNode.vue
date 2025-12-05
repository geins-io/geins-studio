<script setup>
import { Handle, Position, useVueFlow } from '@vue-flow/core';

const props = defineProps(['id', 'data']);

const { updateNodeData } = useVueFlow();

const value = computed({
  get: () => props.data.value,
  set: value => updateNodeData(props.id, { value })
});
</script>

<template>
  Documents
  <input :id="`${id}-input`" v-model="value" type="number" class="nodrag">

  <Handle type="source" :position="Position.Bottom" :connectable="true" />
</template>
