<script setup lang="ts">
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue';

const props = defineProps<{
  nodeData: Record<string, unknown>;
  nodeConfig: Record<string, unknown>;
  nodeInput: Record<string, unknown>;
  updateConfig: (name: string, value: unknown) => void;
  updateInput: (name: string, value: unknown) => void;
}>();

const collection = computed(() => String(props.nodeInput.collection ?? ''));
const maxIterations = computed(
  () => props.nodeInput.maxIterations as number | undefined,
);
const maxConcurrent = computed(
  () => props.nodeInput.maxConcurrent as number | undefined,
);

const CONTEXT_VARS = [
  { expr: '{{$current}}', description: 'Current item in the iteration' },
  {
    expr: '{{$index}}',
    description: 'Zero-based index of the current iteration',
  },
];
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <label class="text-sm font-medium">
        Collection
        <span class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="collection"
        placeholder="e.g. {{order.items}}"
        default-mode="expression"
        @update:model-value="updateInput('collection', $event)"
      />
      <p class="text-muted-foreground text-xs">
        Expression resolving to the array to iterate over
      </p>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Max iterations</label>
      <Input
        type="number"
        :model-value="maxIterations ?? 100"
        placeholder="100"
        min="1"
        @update:model-value="
          updateInput(
            'maxIterations',
            $event === '' ? undefined : Number($event),
          )
        "
      />
      <p class="text-muted-foreground text-xs">
        Safety limit to prevent infinite loops
      </p>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Max concurrent</label>
      <Input
        type="number"
        :model-value="maxConcurrent ?? 1"
        placeholder="1"
        min="1"
        max="10"
        @update:model-value="
          updateInput(
            'maxConcurrent',
            $event === ''
              ? undefined
              : Math.min(10, Math.max(1, Number($event))),
          )
        "
      />
      <p class="text-muted-foreground text-xs">
        Parallel branches (1 = serial, max 10)
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
            class="shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-purple-600 dark:text-purple-400"
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
        <span class="font-medium text-purple-600">Foreach</span>
        executes once per collection item
      </p>
      <p class="mt-1">
        <span class="font-medium text-gray-500">Completed</span>
        runs after all iterations complete
      </p>
    </div>
  </div>
</template>
