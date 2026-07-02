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

const collection = computed(() => String(props.nodeInput.collection ?? ''));
const maxIterations = computed(
  () => props.nodeInput.maxIterations as number | undefined,
);
const maxConcurrent = computed(
  () => props.nodeInput.maxConcurrent as number | undefined,
);

const CONTEXT_VARS = [
  {
    expr: '{{$current}}',
    description: t('node.settings.iterator.var_current'),
  },
  {
    expr: '{{$index}}',
    description: t('node.settings.iterator.var_index'),
  },
];
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.iterator.collection') }}
        <span class="text-destructive">*</span>
      </label>
      <ExpressionInput
        :model-value="collection"
        :placeholder="$t('node.settings.iterator.collection_placeholder')"
        default-mode="expression"
        @update:model-value="updateInput('collection', $event)"
      />
      <p class="text-muted-foreground text-xs">
        {{ $t('node.settings.iterator.collection_help') }}
      </p>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.iterator.max_iterations') }}
      </label>
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
        {{ $t('node.settings.iterator.max_iterations_help') }}
      </p>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">
        {{ $t('node.settings.iterator.max_concurrent') }}
      </label>
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
        {{ $t('node.settings.iterator.max_concurrent_help') }}
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
        <span class="font-medium text-purple-600">
          {{ $t('node.settings.iterator.foreach') }}
        </span>
        {{ $t('node.settings.iterator.foreach_help') }}
      </p>
      <p class="mt-1">
        <span class="font-medium text-gray-500">
          {{ $t('node.settings.completed') }}
        </span>
        {{ $t('node.settings.iterator.completed_help') }}
      </p>
    </div>
  </div>
</template>
