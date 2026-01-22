<script setup>
import { ref } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { ControlButton, Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
// import { initialEdges, initialNodes } from './data/initial-elements-basic.js';
import { initialEdges, initialNodes } from './data/initial-elements-math.js';
import Icon from './toolbar/Icon.vue';
import SaveRestoreControls from './controls/SaveRestoreControls.vue';
import ValueNode from './nodes/ValueNode.vue';
import OperatorNode from './nodes/OperatorNode.vue';
import ResultNode from './nodes/ResultNode.vue';
import CustomNode from './nodes/CustomNode.vue';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
// i//mport '@vue-flow/minimap/dist/style.css';
// import '@vue-flow/node-resizer/dist/style.css';
definePageMeta({
  pageType: 'canvas',
});
/**
 * `useVueFlow` provides:
 * 1. a set of methods to interact with the VueFlow instance (like `fitView`, `setViewport`, `addEdges`, etc)
 * 2. a set of event-hooks to listen to VueFlow events (like `onInit`, `onNodeDragStop`, `onConnect`, etc)
 * 3. the internal state of the VueFlow instance (like `nodes`, `edges`, `viewport`, etc)
 */
const { onInit, onNodeDragStop, onConnect, addEdges, setViewport, toObject } = useVueFlow();

const nodes = ref(initialNodes);

const edges = ref(initialEdges);

// our dark mode toggle flag
const dark = ref(false);

/**
 * This is a Vue Flow event-hook which can be listened to from anywhere you call the composable, instead of only on the main component
 * Any event that is available as `@event-name` on the VueFlow component is also available as `onEventName` on the composable and vice versa
 *
 * onInit is called when the VueFlow viewport is initialized
 */
onInit((vueFlowInstance) => {
  // instance is the same as the return of `useVueFlow`
  vueFlowInstance.fitView();
});

/**
 * onNodeDragStop is called when a node is done being dragged
 *
 * Node drag events provide you with:
 * 1. the event object
 * 2. the nodes array (if multiple nodes are dragged)
 * 3. the node that initiated the drag
 * 4. any intersections with other nodes
 */
onNodeDragStop(({ event, nodes, node }) => {
  console.log('Node Drag Stop', { event, nodes, node });
});

/**
 * onConnect is called when a new connection is created.
 *
 * You can add additional properties to your new edge (like a type or label) or block the creation altogether by not calling `addEdges`
 */
onConnect((connection) => {
  addEdges(connection);
});

/**
 * To update a node or multiple nodes, you can
 * 1. Mutate the node objects *if* you're using `v-model`
 * 2. Use the `updateNode` method (from `useVueFlow`) to update the node(s)
 * 3. Create a new array of nodes and pass it to the `nodes` ref
 */
function updatePos() {
  nodes.value = nodes.value.map((node) => {
    return {
      ...node,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400
      }
    };
  });
}

/**
 * toObject transforms your current graph data to an easily persist-able object
 */
function logToObject() {
  console.log(toObject());
}
/**
 * Resets the current viewport transformation (zoom & pan)
 */
function resetTransform() {
  setViewport({ x: 0, y: 0, zoom: 1 });
}
function toggleDarkMode() {
  console.log('toggleDarkMode', dark.value);
  dark.value = !dark.value;
  console.log('toggleDarkMode', dark.value);
}
function onSave() {
  console.log('onSave', toObject());
  localStorage.setItem(flowKey, JSON.stringify(toObject()));
}
</script>

<template>
  <div class="w-full h-full">
    <VueFlow :nodes="nodes" :edges="edges" :class="{ dark }" class="basic-flow" :default-viewport="{ zoom: 2.0 }"
      :min-zoom="0.2" :max-zoom="4">
      <SaveRestoreControls />
      <template #node-value="props">
        <ValueNode :id="props.id" :data="props.data" />
      </template>
      <template #node-value2="props">
        <ValueNode :id="props.id" :data="props.data" />
      </template>

      <template #node-operator="props">
        <OperatorNode :id="props.id" :data="props.data" />
      </template>

      <template #node-result="props">
        <ResultNode :id="props.id" />
      </template>

      <Background pattern-color="#aaa" :gap="16" />

      <MiniMap v-if="false" />

    </VueFlow>
  </div>
</template>

<style>
.basic-flow {
  width: 100%;
  height: 100%;
}

.vue-flow__minimap {
  transform: scale(75%);
  transform-origin: bottom right;
}

.basic-flow.dark {
  background: #2d3748;
  color: #fffffb
}

.basic-flow.dark .vue-flow__node {
  background: #4a5568;
  color: #fffffb
}

.basic-flow.dark .vue-flow__node.selected {
  background: #333;
  box-shadow: 0 0 0 2px #2563eb
}

.basic-flow .vue-flow__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center
}

.basic-flow.dark .vue-flow__controls {
  border: 1px solid #FFFFFB
}

.basic-flow .vue-flow__controls .vue-flow__controls-button {
  border: none;
  border-right: 1px solid #eee
}

.basic-flow .vue-flow__controls .vue-flow__controls-button svg {
  height: 100%;
  width: 100%
}

.basic-flow.dark .vue-flow__controls .vue-flow__controls-button {
  background: #333;
  fill: #fffffb;
  border: none
}

.basic-flow.dark .vue-flow__controls .vue-flow__controls-button:hover {
  background: #4d4d4d
}

.basic-flow.dark .vue-flow__edge-textbg {
  fill: #292524
}

.basic-flow.dark .vue-flow__edge-text {
  fill: #fffffb
}

.vue-flow__minimap {
  transform: scale(75%);
  transform-origin: bottom right;
}

.math-flow {
  background-color: #edf2f7;
  height: 100%;
  width: 100%
}

.vue-flow__handle {
  height: 24px;
  width: 10px;
  background: #aaa;
  border-radius: 4px
}

.vue-flow__edges path {
  stroke-width: 3
}

.vue-flow__node {
  background-color: #f3f4f6
}

.vue-flow__node-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 0 10px #0003
}

.vue-flow__node-value.selected {
  box-shadow: 0 0 0 2px #ec4899
}

.vue-flow__node-value input {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 0 10px #0000001a
}

.vue-flow__node-value input:focus {
  outline: none;
  box-shadow: 0 0 0 2px #ec4899;
  transition: box-shadow .2s
}

.vue-flow__node-value .vue-flow__handle {
  background-color: #ec4899
}

.vue-flow__node-value2 {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 0 10px #0003
}

.vue-flow__node-value2.selected {
  box-shadow: 0 0 0 2px #ec4899
}

.vue-flow__node-value2 input {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 0 10px #0000001a
}

.vue-flow__node-value2 input:focus {
  outline: none;
  box-shadow: 0 0 0 2px #ec4899;
  transition: box-shadow .2s
}

.vue-flow__node-value2 .vue-flow__handle {
  background-color: #ec4899
}

.vue-flow__node-operator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px #0003
}

.vue-flow__node-operator.selected {
  box-shadow: 0 0 0 2px #2563eb
}

.vue-flow__node-operator .buttons {
  display: flex;
  gap: 8px
}

.vue-flow__node-operator button {
  border: none;
  cursor: pointer;
  background-color: #4a5568;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 0 10px #0000004d;
  width: 40px;
  height: 40px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center
}

.vue-flow__node-operator button svg {
  width: 100%;
  height: 100%
}

.vue-flow__node-operator button:hover {
  background-color: #2563eb;
  transition: background-color .2s
}

.vue-flow__node-operator button.selected {
  background-color: #2563eb
}

.vue-flow__node-operator .vue-flow__handle[data-handleid=target-a] {
  left: 25%
}

.vue-flow__node-operator .vue-flow__handle[data-handleid=target-b] {
  left: 75%
}

.vue-flow__node-operator .vue-flow__handle {
  background-color: #2563eb
}

.vue-flow__node-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 0 10px #0003
}

.vue-flow__node-result.selected {
  box-shadow: 0 0 0 2px #5ec697
}

.vue-flow__node-result .result {
  display: flex;
  gap: 8px;
  font-size: 24px
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0
}

input[type=number] {
  -moz-appearance: textfield
}

.vue-flow__panel {
  background-color: #2d3748;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 0 10px #00000080
}

.vue-flow__panel .buttons {
  display: flex;
  gap: 8px
}

.vue-flow__panel button {
  border: none;
  cursor: pointer;
  background-color: #4a5568;
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 0 10px #0000004d;
  width: 40px;
  height: 40px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center
}

.vue-flow__panel button:hover {
  background-color: #2563eb;
  transition: background-color .2s
}

.vue-flow__panel button svg {
  width: 100%;
  height: 100%
}
</style>
