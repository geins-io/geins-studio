<script setup lang="ts">
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue';

const props = defineProps<{
  nodeData: Record<string, unknown>;
  nodeConfig: Record<string, unknown>;
  nodeInput: Record<string, unknown>;
  updateConfig: (name: string, value: unknown) => void;
  updateInput: (name: string, value: unknown) => void;
}>();

const STRATEGY_OPTIONS = [
  {
    value: 'offset',
    label: 'Offset',
    description: 'Skip-based pagination (offset + limit)',
  },
  {
    value: 'pageNumber',
    label: 'Page Number',
    description: 'Classic page-number pagination (page=1, page=2, ...)',
  },
  {
    value: 'cursor',
    label: 'Cursor',
    description: 'Opaque cursor/token-based pagination',
  },
  {
    value: 'linkHeader',
    label: 'Link Header',
    description: 'Follows RFC 5988 Link headers (rel="next")',
  },
  {
    value: 'watermark',
    label: 'Watermark',
    description: 'Per-item high-water mark (e.g. last modified timestamp)',
  },
];

const CURSOR_STRATEGIES = new Set(['cursor', 'linkHeader', 'watermark']);

const strategy = computed(() => String(props.nodeInput.strategy ?? ''));
const pageSize = computed(() => String(props.nodeInput.pageSize ?? ''));
const maxPages = computed(() => props.nodeInput.maxPages as number | undefined);
const initialCursor = computed(() =>
  String(props.nodeInput.initialCursor ?? ''),
);
const itemsPath = computed(() => String(props.nodeInput.itemsPath ?? ''));
const cursorPath = computed(() => String(props.nodeInput.cursorPath ?? ''));
const terminationCondition = computed(() =>
  String(props.nodeInput.terminationCondition ?? ''),
);

const showCursorFields = computed(() => CURSOR_STRATEGIES.has(strategy.value));
const cursorPathRequired = computed(
  () => strategy.value === 'cursor' || strategy.value === 'linkHeader',
);

const strategyDescription = computed(
  () =>
    STRATEGY_OPTIONS.find((s) => s.value === strategy.value)?.description ??
    'Select a pagination strategy',
);

const onStrategyChange = (value: string) => {
  props.updateInput('strategy', value || undefined);
  if (!CURSOR_STRATEGIES.has(value)) {
    props.updateInput('cursorPath', undefined);
    props.updateInput('initialCursor', undefined);
  }
};

const CONTEXT_VARS = [
  {
    expr: '{{$cursor}}',
    description: 'Current pagination cursor (strategy-specific)',
  },
  { expr: '{{$pageNumber}}', description: '1-based page number being fetched' },
  { expr: '{{$pageSize}}', description: 'Configured page size' },
];
</script>

<template>
  <div class="space-y-4">
    <!-- Strategy -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        Strategy
        <span class="text-destructive">*</span>
      </label>
      <select
        :value="strategy"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @change="onStrategyChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>Select strategy…</option>
        <option
          v-for="opt in STRATEGY_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <p class="text-muted-foreground text-xs">{{ strategyDescription }}</p>
    </div>

    <!-- Page Size -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        Page size
        <span class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="pageSize"
        placeholder="e.g. 50 or {{input.pageSize}}"
        default-mode="expression"
        @update:model-value="updateInput('pageSize', $event)"
      />
      <p class="text-muted-foreground text-xs">Number of items per page</p>
    </div>

    <!-- Items Path -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        Items path
        <span class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="itemsPath"
        placeholder="e.g. {{$fetchPage.data.items}}"
        default-mode="expression"
        @update:model-value="updateInput('itemsPath', $event)"
      />
      <p class="text-muted-foreground text-xs">
        Path to the items array on fetchPage output
      </p>
    </div>

    <!-- Cursor Path (conditional) -->
    <div v-if="showCursorFields" class="space-y-1">
      <label class="text-sm font-medium">
        Cursor path
        <span v-if="cursorPathRequired" class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="cursorPath"
        placeholder="e.g. {{$fetchPage.data.nextCursor}}"
        default-mode="expression"
        @update:model-value="updateInput('cursorPath', $event)"
      />
      <p class="text-muted-foreground text-xs">
        {{
          strategy === 'watermark'
            ? 'Per-item field used as watermark'
            : 'Path to the next-page cursor in fetchPage output'
        }}
      </p>
    </div>

    <!-- Max Pages -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Max pages</label>
      <Input
        type="number"
        :model-value="maxPages ?? 1000"
        placeholder="1000"
        min="1"
        @update:model-value="
          updateInput('maxPages', $event === '' ? undefined : Number($event))
        "
      />
      <p class="text-muted-foreground text-xs">
        Safety cap on the number of pages fetched
      </p>
    </div>

    <!-- Initial Cursor (conditional) -->
    <div v-if="showCursorFields" class="space-y-1">
      <label class="text-sm font-medium">Initial cursor</label>
      <ExpressionInput
        :model-value="initialCursor"
        placeholder="Optional starting cursor"
        default-mode="expression"
        @update:model-value="updateInput('initialCursor', $event || undefined)"
      />
      <p class="text-muted-foreground text-xs">
        Override the starting cursor (defaults are strategy-specific)
      </p>
    </div>

    <!-- Termination Condition -->
    <div class="space-y-1">
      <label class="text-sm font-medium">Termination condition</label>
      <ExpressionInput
        :model-value="terminationCondition"
        placeholder="Optional override"
        default-mode="expression"
        @update:model-value="
          updateInput('terminationCondition', $event || undefined)
        "
      />
      <p class="text-muted-foreground text-xs">
        Override the strategy's default stop condition
      </p>
    </div>

    <!-- Context variables reference -->
    <div class="border-t pt-3">
      <p class="text-muted-foreground mb-2 text-xs font-medium">
        Context variables
      </p>
      <div class="space-y-1.5">
        <div
          v-for="v in CONTEXT_VARS"
          :key="v.expr"
          class="bg-muted/50 flex items-start gap-2 rounded-md px-2.5 py-2"
        >
          <code
            class="shrink-0 rounded bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
          >
            {{ v.expr }}
          </code>
          <p class="text-muted-foreground text-[11px]">{{ v.description }}</p>
        </div>
      </div>
    </div>

    <!-- Handle labels reference -->
    <div class="text-muted-foreground border-t pt-3 text-xs">
      <p>
        <span class="font-medium text-indigo-600">Fetch Page</span>
        action that fetches one page
      </p>
      <p class="mt-1">
        <span class="font-medium text-indigo-600">Each Page</span>
        body executed per page
      </p>
      <p class="mt-1">
        <span class="font-medium text-gray-500">Completed</span>
        runs after all pages are processed
      </p>
    </div>
  </div>
</template>
