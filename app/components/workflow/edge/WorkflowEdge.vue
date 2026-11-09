<script setup lang="ts">
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useEdge,
  Position,
} from '@vue-flow/core';

const props = defineProps<{
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: string;
  targetPosition: string;
  markerEnd?: string;
  label?: string;
}>();

const { edge } = useEdge();

const isUnrouted = computed(() => {
  const sourceNode = edge.sourceNode;
  return (
    sourceNode?.type === 'condition' &&
    isUnroutedConditionEdge(edge, sourceNode.data)
  );
});

// VueFlow draws an edge with no `sourceHandle` from the node's first handle,
// which on a condition is a branch the engine never sends down this edge.
// Draw it from the node's bottom instead so it doesn't look connected.
const source = computed(() => {
  const sourceNode = edge.sourceNode;
  const hasBranchHandles =
    Array.isArray(sourceNode?.data?.conditions) &&
    sourceNode.data.conditions.length > 0;
  if (!isUnrouted.value || !hasBranchHandles) {
    return {
      x: props.sourceX,
      y: props.sourceY,
      position: props.sourcePosition as Position,
    };
  }
  return {
    x: sourceNode.computedPosition.x + sourceNode.dimensions.width / 2,
    y: sourceNode.computedPosition.y + sourceNode.dimensions.height,
    position: Position.Bottom,
  };
});

const path = computed(() =>
  getBezierPath({
    sourceX: source.value.x,
    sourceY: source.value.y,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: source.value.position,
    targetPosition: props.targetPosition as Position,
  }),
);

const edgeLength = computed(() => {
  const dx = props.targetX - source.value.x;
  const dy = props.targetY - source.value.y;
  return Math.sqrt(dx * dx + dy * dy);
});

const isCompact = computed(() => edgeLength.value < 120);

const isHovered = ref(false);

const interactionEl = ref<SVGPathElement | null>(null);

const attachInteraction = (): boolean => {
  const edgeEl =
    document.querySelector(`[data-id="${edge.id}"]`) ??
    document.querySelector(`[data-id="vueflow__edge-${edge.id}"]`);
  const interaction = edgeEl?.querySelector(
    '.vue-flow__edge-interaction',
  ) as SVGPathElement | null;
  if (interaction && interaction !== interactionEl.value) {
    interactionEl.value = interaction;
    interaction.style.pointerEvents = 'all';
    interaction.addEventListener('mouseenter', () => {
      isHovered.value = true;
    });
    interaction.addEventListener('mouseleave', () => {
      isHovered.value = false;
    });
    return true;
  }
  return false;
};

onMounted(() => {
  let attempts = 0;
  const tryAttach = () => {
    if (attachInteraction() || attempts++ > 10) return;
    requestAnimationFrame(tryAttach);
  };
  requestAnimationFrame(tryAttach);
});

onBeforeUnmount(() => {
  interactionEl.value = null;
});

const { t } = useI18n();

const onEdgeAddNode =
  inject<
    (
      edgeId: string,
      sourceNodeId: string,
      targetNodeId: string,
      sourceHandle?: string | null,
    ) => void
  >('onEdgeAddNode');
const onEdgeDelete = inject<(edgeId: string) => void>('onEdgeDelete');

const onAdd = () => {
  onEdgeAddNode?.(edge.id, edge.source, edge.target, edge.sourceHandle);
};

const onDelete = () => {
  onEdgeDelete?.(edge.id);
};
</script>

<template>
  <BaseEdge
    :path="path[0]"
    :marker-end="markerEnd"
    :label="label"
    :interaction-width="24"
    :class="{ '!stroke-destructive [stroke-dasharray:6_4]': isUnrouted }"
  />
  <EdgeLabelRenderer>
    <div
      class="edge-toolbar nodrag nopan pointer-events-auto absolute flex items-center gap-1"
      :style="{
        transform: `translate(-50%, -50%) translate(${path[1]}px, ${path[2]}px)`,
      }"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <TooltipProvider v-if="isUnrouted" :delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <div
              class="bg-destructive text-destructive-foreground flex h-6 w-6 items-center justify-center rounded-full shadow-sm"
            >
              <LucideTriangleAlert class="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent class="max-w-xs">
            {{ t('workflow_builder.unrouted_condition_edge') }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button
        v-show="!isHovered || isCompact"
        class="bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors"
        :title="
          isCompact
            ? t('workflow_builder.add_node')
            : t('workflow_builder.edge_actions')
        "
        @click="onAdd"
      >
        <LucidePlus v-if="isCompact" class="h-3 w-3" />
        <LucideEllipsis v-else class="h-3 w-3" />
      </button>
      <template v-if="isHovered && !isCompact">
        <button
          class="bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors"
          :title="t('workflow_builder.add_node')"
          @click="onAdd"
        >
          <LucidePlus class="h-3 w-3" />
        </button>
        <button
          class="bg-background text-muted-foreground hover:border-destructive/50 hover:text-destructive flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors"
          :title="t('workflow_builder.delete_connection')"
          @click="onDelete"
        >
          <LucideTrash2 class="h-3 w-3" />
        </button>
      </template>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.edge-toolbar {
  opacity: 1;
}

.edge-action-enter-active,
.edge-action-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.edge-action-enter-from,
.edge-action-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
