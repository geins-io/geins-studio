<script setup lang="ts">
import { useNode, useVueFlow } from '@vue-flow/core';
import WorkflowHandleInput from './handle/WorkflowHandleInput.vue';
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue';

type ConditionEntry = {
  label: string;
  condition?: string;
  description?: string;
};

const props = defineProps<{
  data: {
    label: string;
    icon: string;
    description: string;
    config: Record<string, unknown>;
    conditions?: ConditionEntry[];
    defaultLabel?: string;
    ui?: Record<string, unknown>;
  };
  selected?: boolean;
}>();

const BRANCH_COLORS = [
  {
    bg: '!bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
  {
    bg: '!bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  {
    bg: '!bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  {
    bg: '!bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  {
    bg: '!bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  {
    bg: '!bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    dot: 'bg-cyan-500',
  },
];

function branchColor(index: number) {
  return (
    BRANCH_COLORS[
      ((index % BRANCH_COLORS.length) + BRANCH_COLORS.length) %
        BRANCH_COLORS.length
    ] ?? BRANCH_COLORS[0]!
  );
}

const conditionColors = computed<number[]>(() => {
  const colors = props.data.ui?.conditionColors;
  return Array.isArray(colors) ? (colors as number[]) : [];
});

function getConditionColor(index: number): number {
  return conditionColors.value[index] ?? index % BRANCH_COLORS.length;
}

const hasConditions = computed(() => {
  const conds = props.data.conditions;
  return Array.isArray(conds) && conds.length > 0;
});

const branches = computed(() => {
  const conds = props.data.conditions;
  if (!conds || conds.length === 0) return [];

  const items = conds.map((c, i) => ({
    id: c.label,
    label: c.label,
    isDefault: false,
    colorIndex: getConditionColor(i),
  }));

  if (props.data.defaultLabel) {
    items.push({
      id: props.data.defaultLabel,
      label: props.data.defaultLabel,
      isDefault: true,
      colorIndex: -1,
    });
  }

  return items;
});

const HANDLE_SPACING_PX = 36;

// Pixel offsets from center for each branch handle.
// E.g. 2 branches → [-18, 18], 3 → [-36, 0, 36]
const handleOffsets = computed(() => {
  const count = branches.value.length;
  if (count === 0) return [];
  if (count === 1) return [0];
  const totalSpan = (count - 1) * HANDLE_SPACING_PX;
  const startOffset = -totalSpan / 2;
  return branches.value.map((_, i) => startOffset + i * HANDLE_SPACING_PX);
});

const labelRefs = ref<HTMLElement[]>([]);
const lineLength = ref(24);
const LINE_PAD = 12;
const MIN_LINE = 24;

function measureLabels() {
  const maxWidth = labelRefs.value.reduce(
    (max, el) => Math.max(max, el?.offsetWidth ?? 0),
    0,
  );
  lineLength.value = Math.max(MIN_LINE, maxWidth + LINE_PAD);
}

const { id: nodeId } = useNode();
const { updateNodeInternals } = useVueFlow();

watch(
  branches,
  () =>
    nextTick(() => {
      measureLabels();
      updateNodeInternals([nodeId]);
    }),
  { immediate: true },
);
onMounted(() =>
  nextTick(() => {
    measureLabels();
    updateNodeInternals([nodeId]);
  }),
);
</script>

<template>
  <div
    class="bg-background flex min-w-[180px] flex-col justify-center rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="
      selected
        ? 'border-yellow-500 ring-[6px] ring-yellow-500/20'
        : 'border-yellow-500/50'
    "
  >
    <!-- Input handle -->
    <WorkflowHandleInput
      handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-yellow-500"
    />

    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500"
      >
        <LucideGitBranch class="h-5 w-5" />
      </div>
      <div>
        <div
          class="text-xs font-medium tracking-wider text-yellow-500 uppercase"
        >
          {{ $t('node.types.condition') }}
        </div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Condition preview -->
    <div v-if="hasConditions" class="mt-2 space-y-0.5">
      <div
        v-for="(cond, ci) in data.conditions!.slice(0, 3)"
        :key="cond.label"
        class="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px]"
      >
        <span
          class="h-1.5 w-1.5 shrink-0 rounded-full"
          :class="branchColor(getConditionColor(ci)).dot"
        />
        <span class="text-muted-foreground min-w-0 truncate font-mono">
          {{ cond.condition || cond.label }}
        </span>
      </div>
      <div
        v-if="data.conditions!.length > 3"
        class="text-muted-foreground px-2 text-[10px] opacity-60"
      >
        {{ $t('node.more_count', { count: data.conditions!.length - 3 }) }}
      </div>
    </div>
    <div
      v-else-if="data.config?.field"
      class="bg-muted/50 text-muted-foreground mt-2 rounded px-2 py-1 text-xs"
    >
      {{ data.config.field }} {{ data.config.operator }} "{{
        data.config.value
      }}"
    </div>

    <!-- Branch labels + handles (only when conditions are configured) -->
    <template v-if="hasConditions">
      <div
        v-for="(branch, i) in branches"
        :key="`label-${branch.id}`"
        :ref="
          (el) => {
            if (el) labelRefs[i] = el as HTMLElement;
          }
        "
        class="bg-background/80 absolute -right-1 max-w-[80px] translate-x-full truncate rounded px-1 text-[10px] font-medium whitespace-nowrap"
        :class="
          branch.isDefault
            ? 'text-muted-foreground'
            : branchColor(branch.colorIndex).text
        "
        :style="{ top: `calc(50% + ${(handleOffsets[i] ?? 0) - 8}px)` }"
      >
        {{ branch.label }}
      </div>

      <WorkflowHandlePlus
        v-for="(branch, i) in branches"
        :key="branch.id"
        :handle-id="branch.id"
        :line-length="lineLength"
        :style="{ top: `calc(50% + ${handleOffsets[i] ?? 0}px)` }"
        :handle-class="`!border-background !h-3 !w-3 !border-2 ${branch.isDefault ? '!bg-muted-foreground' : branchColor(branch.colorIndex).bg}`"
      />
    </template>

    <!-- Default single output handle (no conditions configured yet) -->
    <WorkflowHandlePlus
      v-else
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-yellow-500"
    />
  </div>
</template>
