<script setup>
import { computed } from 'vue';
import { Handle, Position, useNodeConnections, useNodesData } from '@vue-flow/core';

defineProps(['id']);

const sourceConnections = useNodeConnections({
  handleType: 'target'
});

const operatorData = useNodesData(() => sourceConnections.value.map(connection => connection.source));
const calcOperator = computed(() => {
  const operator = operatorData.value[0]?.data?.operator;
  if (operator) {
    return operator;
  }
  return '';
});
const calcValueA = computed(() => {
  const value = operatorData.value[0]?.data?.a;
  if (value) {
    return value;
  }
  return '';
});
const calcValueB = computed(() => {
  const value = operatorData.value[0]?.data?.b;
  if (value) {
    return value;
  }
  return '';
});

const result = computed(() => {
  console.log('operatorData', operatorData.value);
  if (operatorData.value.length === 0) {
    return '';
  }

  const data = operatorData.value[0]?.data;

  return Math.round(data.value * 100) / 100;
});
</script>

<template>


  <span class="result" :style="{ color: result > 0 ? '#5EC697' : '#f15a16' }">
    {{ result }}
  </span>

  <Handle type="target" :position="Position.Top" :connectable="top"
    :style="{ background: result > 0 ? '#5EC697' : '#f15a16' }" />
</template>
