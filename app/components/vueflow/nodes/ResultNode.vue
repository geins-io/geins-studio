<script setup>
import { computed } from 'vue';
import { Handle, Position, useNodeConnections, useNodesData } from '@vue-flow/core';

defineProps(['id']);

const sourceConnections = useNodeConnections({
  handleType: 'target'
});

const operatorData = useNodesData(() => sourceConnections.value.map(connection => connection.source));
const calcOperator = computed(() => operatorData.value[0]?.data?.operator);
const calcValueA = computed(() => operatorData.value[0]?.data?.a);
const calcValueB = computed(() => operatorData.value[0]?.data?.b);

const result = computed(() => {
  const data = operatorData.value[0]?.data;

  return Math.round(data.value * 100) / 100;
});
</script>

<template>
  <div class="calculation">
    <span>
      {{ calcValueA }}
    </span>
    <span>
      {{ calcOperator }}
    </span>
    <span>
      {{ calcValueB }}
    </span>
  </div>

  <span> = </span>

  <span class="result" :style="{ color: result > 0 ? '#5EC697' : '#f15a16' }">
    {{ result }}
  </span>

  <Handle type="target" :position="Position.Top" :connectable="top"
    :style="{ background: result > 0 ? '#5EC697' : '#f15a16' }" />
</template>
