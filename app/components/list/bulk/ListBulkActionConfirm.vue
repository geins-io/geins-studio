<script setup lang="ts">
import type { BulkAction, BulkRunResult } from '#shared/types';

/**
 * Confirm step for a bulk action: asks the action's question (its
 * `confirmTitle`), shows the value (`summary`), any `warning` and the `note`,
 * then runs it through `useBulkRunner` and emits the outcome. The button says
 * the action's label. Used by `ListBulkActionSheet` and directly by bar
 * shortcuts (e.g. Move to trash).
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

const MAX_TAGS = 8;

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const { run } = useBulkRunner();
const running = ref(false);

const customTitle = computed(() =>
  props.action?.confirmTitle?.(props.ids.length, props.value),
);
const title = computed(() => customTitle.value ?? t('confirm_bulk_action'));
// Without its own question the action falls back to the generic line, which
// names the action and the count the title then leaves out.
const lead = computed(() => {
  const parts = customTitle.value
    ? []
    : [
        t(
          'bulk_action_confirm_description',
          {
            action: props.action?.label,
            count: props.ids.length,
            entityKey: props.entityKey,
          },
          props.ids.length,
        ),
      ];
  if (props.scopeNote) parts.push(props.scopeNote);
  return parts.join(' ');
});

const summary = computed(() => props.action?.summary?.(props.value));
const tags = computed(() =>
  summary.value && 'tags' in summary.value ? summary.value.tags : undefined,
);
const path = computed(() =>
  summary.value && 'path' in summary.value ? summary.value : undefined,
);
const list = computed(() =>
  summary.value && 'list' in summary.value ? summary.value.list : undefined,
);
const hiddenTags = computed(() =>
  Math.max((tags.value?.length ?? 0) - MAX_TAGS, 0),
);
const warning = computed(() => props.action?.warning?.(props.value));
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
        <AlertDialogTitle class="wrap-break-word">{{ title }}</AlertDialogTitle>
      </AlertDialogHeader>
      <!-- Everything under the title is the description, so screen readers
           get the value and the consequences, not only the question. -->
      <AlertDialogDescription as="div" class="flex flex-col gap-4">
        <p v-if="lead">{{ lead }}</p>
        <div
          v-if="tags?.length"
          class="text-foreground flex flex-wrap items-center gap-1.5"
          data-test="bulk-confirm-tags"
        >
          <Tag v-for="tag in tags.slice(0, MAX_TAGS)" :key="tag" :label="tag" />
          <span v-if="hiddenTags" class="text-muted-foreground text-xs">
            {{ $t('more_count', { count: hiddenTags }) }}
          </span>
        </div>
        <div
          v-else-if="path?.path.length"
          class="text-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1"
          data-test="bulk-confirm-path"
        >
          <component
            :is="resolveIcon(path.icon)"
            v-if="path.icon"
            class="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          <template v-for="(segment, index) in path.path" :key="index">
            <LucideChevronRight
              v-if="index"
              class="text-muted-foreground size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span
              :class="
                index === path.path.length - 1
                  ? 'font-medium'
                  : 'text-muted-foreground'
              "
              class="wrap-break-word"
            >
              {{ segment }}
            </span>
          </template>
        </div>
        <ul
          v-else-if="list?.length"
          class="text-foreground list-disc space-y-1 pl-5"
          data-test="bulk-confirm-list"
        >
          <li v-for="item in list" :key="item">{{ item }}</li>
        </ul>
        <Feedback
          v-if="warning"
          type="warning"
          data-test="bulk-confirm-warning"
        >
          <template #title>{{ warning.title }}</template>
          <template #description>{{ warning.description }}</template>
        </Feedback>
        <p v-if="note" data-test="bulk-confirm-note">{{ note }}</p>
      </AlertDialogDescription>
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
          {{ action?.label ?? $t('confirm') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
