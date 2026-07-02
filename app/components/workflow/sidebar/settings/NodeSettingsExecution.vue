<script setup lang="ts">
import type { ManifestEnumValue, RetryPolicy } from '#shared/types';

const props = defineProps<{
  nodeData: Record<string, unknown>;
  errorHandlingOptions: ManifestEnumValue[];
  defaultRetry: RetryPolicy;
  update: (key: string, value: unknown) => void;
}>();

const { t } = useI18n();
const { errorHandlingLabel } = useWorkflowLabels();

const INHERIT = 'inherit';

const open = ref(false);

const timeout = computed(() => (props.nodeData.timeout as string) ?? '');
const retry = computed(
  () => (props.nodeData.retry as RetryPolicy | null | undefined) ?? null,
);
const strategy = computed(
  () => (props.nodeData.errorHandlingStrategy as string | undefined) ?? INHERIT,
);
const retryEnabled = computed(() => retry.value != null);

const setTimeout = (value: string) =>
  props.update('timeout', value.trim() || undefined);

const setStrategy = (value: string) =>
  props.update('errorHandlingStrategy', value === INHERIT ? undefined : value);

const toggleRetry = (enabled: boolean) =>
  props.update('retry', enabled ? { ...props.defaultRetry } : undefined);

const setRetryField = (field: keyof RetryPolicy, value: unknown) =>
  props.update('retry', {
    ...(retry.value ?? props.defaultRetry),
    [field]: value,
  });
</script>

<template>
  <Collapsible v-model:open="open" class="border-t pt-4">
    <CollapsibleTrigger
      class="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 text-xs font-medium tracking-wider uppercase transition-colors"
    >
      <LucideChevronRight
        class="size-3.5 transition-transform"
        :class="open && 'rotate-90'"
      />
      {{ t('node.execution.title') }}
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="mt-3 space-y-4">
        <!-- Timeout -->
        <div class="space-y-1.5">
          <Label class="text-muted-foreground text-sm">
            {{ t('node.execution.timeout') }}
          </Label>
          <Input
            :model-value="timeout"
            size="sm"
            placeholder="PT30S"
            @update:model-value="setTimeout(String($event))"
          />
          <p class="text-muted-foreground text-xs">
            {{ t('node.execution.timeout_hint') }}
          </p>
        </div>

        <!-- Error handling strategy override -->
        <div class="space-y-1.5">
          <Label class="text-muted-foreground text-sm">
            {{ t('node.execution.error_handling') }}
          </Label>
          <Select
            :model-value="strategy"
            @update:model-value="setStrategy(String($event))"
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="INHERIT">
                {{ t('node.execution.error_handling_inherit') }}
              </SelectItem>
              <SelectItem
                v-for="opt in errorHandlingOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ errorHandlingLabel(opt.value) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Retry policy -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <Switch
              :model-value="retryEnabled"
              @update:model-value="toggleRetry($event)"
            />
            <Label class="text-muted-foreground text-sm">
              {{ t('node.execution.retry') }}
            </Label>
          </div>
          <div v-if="retryEnabled && retry" class="space-y-3 pl-1">
            <div class="space-y-1.5">
              <Label class="text-muted-foreground text-xs">
                {{ t('node.execution.max_attempts') }}
              </Label>
              <Input
                type="number"
                size="sm"
                :model-value="retry.maxAttempts"
                @update:model-value="
                  setRetryField('maxAttempts', Number($event))
                "
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-muted-foreground text-xs">
                {{ t('node.execution.initial_interval') }}
              </Label>
              <Input
                size="sm"
                placeholder="00:00:05"
                :model-value="retry.initialInterval"
                @update:model-value="
                  setRetryField('initialInterval', String($event))
                "
              />
            </div>
            <div class="space-y-1.5">
              <Label class="text-muted-foreground text-xs">
                {{ t('node.execution.backoff_multiplier') }}
              </Label>
              <Input
                type="number"
                size="sm"
                step="0.1"
                :model-value="retry.backoffMultiplier"
                @update:model-value="
                  setRetryField('backoffMultiplier', Number($event))
                "
              />
            </div>
          </div>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
