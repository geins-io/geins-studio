<script setup lang="ts">
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue';

const { t } = useI18n();

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
    label: t('node.settings.paginator.strategy_offset'),
    description: t('node.settings.paginator.strategy_offset_desc'),
  },
  {
    value: 'pageNumber',
    label: t('node.settings.paginator.strategy_page_number'),
    description: t('node.settings.paginator.strategy_page_number_desc'),
  },
  {
    value: 'cursor',
    label: t('node.settings.paginator.strategy_cursor'),
    description: t('node.settings.paginator.strategy_cursor_desc'),
  },
  {
    value: 'linkHeader',
    label: t('node.settings.paginator.strategy_link_header'),
    description: t('node.settings.paginator.strategy_link_header_desc'),
  },
  {
    value: 'watermark',
    label: t('node.settings.paginator.strategy_watermark'),
    description: t('node.settings.paginator.strategy_watermark_desc'),
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
    t('node.settings.paginator.select_strategy_hint'),
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
    description: t('node.settings.paginator.var_cursor'),
  },
  {
    expr: '{{$pageNumber}}',
    description: t('node.settings.paginator.var_page_number'),
  },
  {
    expr: '{{$pageSize}}',
    description: t('node.settings.paginator.var_page_size'),
  },
];
</script>

<template>
  <div class="space-y-4">
    <!-- Strategy -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.paginator.strategy') }}
        <span class="text-destructive">*</span>
      </label>
      <select
        :value="strategy"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @change="onStrategyChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>
          {{ $t('node.settings.paginator.select_strategy') }}
        </option>
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
        {{ $t('node.settings.paginator.page_size') }}
        <span class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="pageSize"
        :placeholder="$t('node.settings.paginator.page_size_placeholder')"
        default-mode="expression"
        @update:model-value="updateInput('pageSize', $event)"
      />
      <p class="text-muted-foreground text-xs">
        {{ $t('node.settings.paginator.page_size_help') }}
      </p>
    </div>

    <!-- Items Path -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.paginator.items_path') }}
        <span class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="itemsPath"
        :placeholder="$t('node.settings.paginator.items_path_placeholder')"
        default-mode="expression"
        @update:model-value="updateInput('itemsPath', $event)"
      />
      <p class="text-muted-foreground text-xs">
        {{ $t('node.settings.paginator.items_path_help') }}
      </p>
    </div>

    <!-- Cursor Path (conditional) -->
    <div v-if="showCursorFields" class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.paginator.cursor_path') }}
        <span v-if="cursorPathRequired" class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="cursorPath"
        :placeholder="$t('node.settings.paginator.cursor_path_placeholder')"
        default-mode="expression"
        @update:model-value="updateInput('cursorPath', $event)"
      />
      <p class="text-muted-foreground text-xs">
        {{
          strategy === 'watermark'
            ? $t('node.settings.paginator.cursor_path_watermark_help')
            : $t('node.settings.paginator.cursor_path_help')
        }}
      </p>
    </div>

    <!-- Max Pages -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.paginator.max_pages') }}
      </label>
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
        {{ $t('node.settings.paginator.max_pages_help') }}
      </p>
    </div>

    <!-- Initial Cursor (conditional) -->
    <div v-if="showCursorFields" class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.paginator.initial_cursor') }}
      </label>
      <ExpressionInput
        :model-value="initialCursor"
        :placeholder="$t('node.settings.paginator.initial_cursor_placeholder')"
        default-mode="expression"
        @update:model-value="updateInput('initialCursor', $event || undefined)"
      />
      <p class="text-muted-foreground text-xs">
        {{ $t('node.settings.paginator.initial_cursor_help') }}
      </p>
    </div>

    <!-- Termination Condition -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.paginator.termination_condition') }}
      </label>
      <ExpressionInput
        :model-value="terminationCondition"
        :placeholder="
          $t('node.settings.paginator.termination_condition_placeholder')
        "
        default-mode="expression"
        @update:model-value="
          updateInput('terminationCondition', $event || undefined)
        "
      />
      <p class="text-muted-foreground text-xs">
        {{ $t('node.settings.paginator.termination_condition_help') }}
      </p>
    </div>

    <!-- Context variables reference -->
    <div class="border-t pt-3">
      <p class="text-muted-foreground mb-2 text-xs font-medium">
        {{ $t('node.settings.context_variables') }}
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
        <span class="font-medium text-indigo-600">
          {{ $t('node.settings.paginator.fetch_page') }}
        </span>
        {{ $t('node.settings.paginator.fetch_page_help') }}
      </p>
      <p class="mt-1">
        <span class="font-medium text-indigo-600">
          {{ $t('node.settings.paginator.each_page') }}
        </span>
        {{ $t('node.settings.paginator.each_page_help') }}
      </p>
      <p class="mt-1">
        <span class="font-medium text-gray-500">
          {{ $t('node.settings.completed') }}
        </span>
        {{ $t('node.settings.paginator.completed_help') }}
      </p>
    </div>
  </div>
</template>
