<script setup lang="ts">
import type { BulkAction, BulkRunResult } from '#shared/types';

/**
 * Confirm step for a bulk action: names the action, the count and the action's
 * summary, then runs it through `useBulkRunner` and emits the outcome. Used by
 * `ListBulkActionSheet` and directly by bar shortcuts (e.g. Move to trash).
 */
const props = defineProps<{
  action?: BulkAction;
  value?: unknown;
  ids: string[];
  /** Raw entity key (e.g. 'asset') for the count. */
  entityKey: string;
  /** Extra line about what the selection covers (e.g. subfolders). */
  scopeNote?: string;
}>();

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ done: [result: BulkRunResult] }>();

const { run } = useBulkRunner();
const running = ref(false);

const summary = computed(() =>
  props.action
    ? (props.action.summary?.(props.value) ?? props.action.label)
    : '',
);
const note = computed(() => props.action?.note?.(props.value));

async function confirm() {
  if (!props.action || running.value) return;
  running.value = true;
  try {
    const result = await run(
      props.action,
      props.ids,
      props.value,
      props.entityKey,
    );
    open.value = false;
    emit('done', result);
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('confirm_bulk_action') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t(
              'bulk_action_confirm_description',
              {
                action: action?.label,
                count: ids.length,
                entityKey,
              },
              ids.length,
            )
          }}
          <template v-if="scopeNote">{{ ' ' }}{{ scopeNote }}</template>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div
        class="bg-background rounded-lg border px-3 py-2.5 text-sm font-medium"
        data-test="bulk-confirm-summary"
      >
        {{ summary }}
      </div>
      <p v-if="note" class="text-muted-foreground text-sm">{{ note }}</p>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="running">
          {{ $t('back') }}
        </AlertDialogCancel>
        <Button
          :loading="running"
          :variant="action?.destructive ? 'destructive' : 'default'"
          data-test="bulk-confirm"
          @click.prevent.stop="confirm"
        >
          {{ $t('confirm') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
