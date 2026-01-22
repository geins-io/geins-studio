<script setup>
import { Panel, useVueFlow } from '@vue-flow/core';
import Icon from '../toolbar/Icon.vue';

const flowKey = 'vue-flow--save-restore';

const { nodes, addNodes, dimensions, toObject, fromObject } = useVueFlow();

function onSave() {
  localStorage.setItem(flowKey, JSON.stringify(toObject()));
  console.log('saved', toObject());
}

function onRestore() {
  const flow = JSON.parse(localStorage.getItem(flowKey));
  console.log('restored', flow);
  if (flow) {
    fromObject(flow);
  }
}

function onAdd() {
  const id = nodes.value.length + 1;

  const newNode = {
    id: `random_node-${id}`,
    type: 'operator',
    label: 'Operator',
    data: { operator: '+' },
    position: { x: 300, y: 100 }
  };

  addNodes([newNode]);
}
</script>

<template>
  <Panel position="top-right">
    <div class="buttons">
      <button title="restore graph" @click="onRestore">
        <Icon name="reset" />
      </button>
      <button title="save graph" @click="onSave">
        <Icon name="save" />
      </button>
      <button title="restore graph" @click="onRestore">
        <Icon name="restore" />
      </button>
      <button title="add random node" @click="onAdd">
        <Icon name="add" />
      </button>
      <button title="add random node" @click="onAdd">
        <Icon name="add" />
      </button>
      <button title="add random node" @click="onAdd">
        <Icon name="add" />
      </button>
      <button title="add random node" @click="onAdd">
        <Icon name="add" />
      </button>
      <button title="add random node" @click="onAdd">
        <Icon name="add" />
      </button>
    </div>
  </Panel>
  :
</template>
<style scoped>
.buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
