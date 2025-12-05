<script setup>
import { Handle, Position, useVueFlow, useNodeConnections, useNodesData } from '@vue-flow/core';
import Icon from '../toolbar/Icon.vue';

const props = defineProps(['id', 'data']);

const operators = ['+', '-', '*', '/'];

const mathFunctions = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b
};

const { updateNodeData } = useVueFlow();

// Get the source connections of the result node. In this example it's only one operator node.
const sourceConnections = useNodeConnections({
  // type target means all connections where *this* node is the target
  // that means we go backwards in the graph to find the source of the connection(s)
  handleType: 'target'
});

const nodeData = useNodesData(() => [props.data]);

// Get the source connections of the operator node
const operatorSourceConnections = useNodeConnections({
  handleType: 'target',
  nodeId: () => sourceConnections.value[0]?.source
});

const operatorData = useNodesData(() => sourceConnections.value.map(connection => connection.source));
const valueData = useNodesData(() => operatorSourceConnections.value.map(connection => connection.source));

const calcValueA = computed(() => operatorData.value[0]?.data?.value);
const calcValueB = computed(() => operatorData.value[1]?.data?.value);
// const calcOperator = computed(() => data.operator);

// method to calculate the result of the operator
const calculate = async (id, operator) => {
  const a = operatorData.value[0]?.data?.value;
  const b = operatorData.value[1]?.data?.value;

  let result = 0;

  if (a && b) {
    result = mathFunctions[operator](a, b);
  }

  const data = {
    operator: operator,
    a: a,
    b: b,
    value: result
  };

  updateNodeData(id, data);
};
</script>

<template>
  <div class="flex flex-col items-center justify-center pb-2">
    <Handle id="target-a" type="target" :position="Position.Top" :connectable="true" />
    <Handle id="target-b" type="target" :position="Position.Top" :connectable="true" />
  </div>
  <div class="buttons nodrag">
    <button v-for="operator of operators" :key="`${id}-${operator}-operator`"
      :class="{ selected: data.operator === operator }" @click="calculate(props.id, operator)">
      <Icon :name="operator" />
    </button>
  </div>
  <div class="calculation">
    <span>
      {{ calcValueA }}
    </span>
    <span>
      {{ data.operator }}
    </span>
    <span>
      {{ calcValueB }}
    </span>
  </div>
  <div class="flex flex-col items-center justify-center">
    <Handle type="source" :position="Position.Bottom" :connectable="true" />
  </div>
</template>
