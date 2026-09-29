<script setup lang="ts">
import type {
  SchemaApplyMode,
  SchemaApplyOptions,
  SchemaChangeAnalysis,
  SchemaChangeEntry,
} from '#shared/types';

const props = defineProps<{
  analysis: SchemaChangeAnalysis;
}>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  confirm: [options: SchemaApplyOptions];
}>();

const { t } = useI18n();

// Default to the safe option; reset each time the dialog opens.
const mode = ref<SchemaApplyMode>('changes');
const removeOrphans = ref(false);
watch(open, (value) => {
  if (value) {
    mode.value = 'changes';
    removeOrphans.value = false;
  }
});

const OPTIONS = [
  { id: 'changes', icon: 'GitMerge' },
  { id: 'reset', icon: 'RotateCcw' },
] as const;

const { resolveIcon } = useLucideIcon();

const hasChanges = computed(
  () =>
    props.analysis.added.length > 0 ||
    props.analysis.typeReset.length > 0 ||
    props.analysis.orphaned.length > 0,
);

function formatValue(entry: SchemaChangeEntry): string {
  return typeof entry.value === 'string'
    ? entry.value
    : JSON.stringify(entry.value);
}

function confirm() {
  emit('confirm', {
    mode: mode.value,
    removeOrphans: mode.value === 'changes' && removeOrphans.value,
  });
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ t('channels.schema_apply_title') }}</DialogTitle>
        <DialogDescription>
          {{ t('channels.schema_apply_description') }}
        </DialogDescription>
      </DialogHeader>

      <RadioGroup
        :model-value="mode"
        class="gap-3"
        @update:model-value="mode = $event === 'reset' ? 'reset' : 'changes'"
      >
        <label
          v-for="option in OPTIONS"
          :key="option.id"
          class="flex w-full cursor-pointer items-start gap-4 rounded-lg border p-4 text-left transition-colors"
          :class="
            mode === option.id
              ? option.id === 'reset'
                ? 'border-warning bg-warning/5'
                : 'border-primary bg-muted/30'
              : 'hover:bg-muted/40'
          "
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg"
            :class="
              option.id === 'reset'
                ? mode === 'reset'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-warning/10 text-warning'
                : mode === 'changes'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
            "
          >
            <component
              :is="resolveIcon(option.icon)"
              class="size-5"
              aria-hidden="true"
            />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 font-semibold">
              <span>{{ t(`channels.schema_apply_${option.id}`) }}</span>
              <Badge
                v-if="option.id === 'changes'"
                variant="secondary"
                size="sm"
              >
                {{ t('recommended') }}
              </Badge>
            </div>
            <p class="text-muted-foreground mt-0.5 text-sm">
              {{ t(`channels.schema_apply_${option.id}_description`) }}
            </p>
          </div>
          <RadioGroupItem :value="option.id" class="self-center" />
        </label>
      </RadioGroup>

      <div v-if="mode === 'changes'" class="min-w-0 space-y-4">
        <p v-if="!hasChanges" class="text-muted-foreground text-sm">
          {{ t('channels.schema_apply_no_changes') }}
        </p>
        <div v-if="analysis.typeReset.length" class="space-y-2">
          <p class="text-sm font-medium">
            {{
              t('channels.schema_apply_type_reset', analysis.typeReset.length)
            }}
          </p>
          <ul
            class="max-h-32 divide-y overflow-y-auto rounded-md border font-mono text-xs"
          >
            <li
              v-for="entry in analysis.typeReset"
              :key="entry.key"
              class="flex gap-2 px-3 py-1.5"
            >
              <span class="max-w-1/2 shrink-0 truncate">{{ entry.key }}</span>
              <span class="text-muted-foreground min-w-0 truncate">
                {{ formatValue(entry) }}
              </span>
            </li>
          </ul>
        </div>

        <p v-if="analysis.added.length" class="text-muted-foreground text-sm">
          {{ t('channels.schema_apply_added', analysis.added.length) }}
        </p>

        <div v-if="analysis.orphaned.length" class="space-y-2">
          <Item variant="outline" class="rounded-lg p-3">
            <ItemContent>
              <ItemTitle>
                {{ t('channels.schema_apply_remove_orphans') }}
              </ItemTitle>
              <ItemDescription>
                {{
                  t(
                    'channels.schema_apply_remove_orphans_description',
                    analysis.orphaned.length,
                  )
                }}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch v-model="removeOrphans" />
            </ItemActions>
          </Item>
          <Feedback v-if="removeOrphans" type="warning">
            <template #title>
              {{ t('channels.schema_apply_remove_orphans_warning_title') }}
            </template>
            <template #description>
              {{
                t('channels.schema_apply_remove_orphans_warning_description')
              }}
            </template>
          </Feedback>
          <p class="pt-1 text-sm font-semibold">
            {{ t('channels.schema_apply_orphans_heading') }}
          </p>
          <ul
            class="max-h-40 divide-y overflow-y-auto rounded-md border font-mono text-xs"
          >
            <li
              v-for="entry in analysis.orphaned"
              :key="entry.key"
              class="flex gap-2 px-3 py-1.5"
              :class="removeOrphans && 'text-destructive line-through'"
            >
              <span class="max-w-1/2 shrink-0 truncate">{{ entry.key }}</span>
              <span
                class="min-w-0 truncate"
                :class="!removeOrphans && 'text-muted-foreground'"
              >
                {{ formatValue(entry) }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <Feedback v-else type="warning">
        <template #title>
          {{ t('channels.schema_apply_reset_warning_title') }}
        </template>
        <template #description>
          {{ t('channels.schema_apply_reset_warning_description') }}
        </template>
      </Feedback>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          {{ t('cancel') }}
        </Button>
        <Button @click="confirm">
          {{ t('channels.schema_editor_apply') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
