<script setup lang="ts">
import type { BulkAction, BulkRunResult } from '#shared/types';

/**
 * Bulk action sheet: a narrow action list on the left, the picked action's
 * properties on the right, then a confirm step that runs it over `ids`. Actions
 * are config (`BulkAction`), so each domain plugs in its own. Not a `PanelEdit`:
 * there's nothing to keep, so closing just drops the draft.
 */
const props = defineProps<{
  actions: BulkAction[];
  ids: string[];
  /** Raw entity key (e.g. 'asset') for the count. */
  entityKey: string;
  /** Extra confirm line about what the selection covers (e.g. subfolders). */
  scopeNote?: string;
}>();

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ done: [result: BulkRunResult] }>();

const { resolveIcon } = useLucideIcon();

const selectedKey = ref<string>();
const value = ref<unknown>();
const confirmOpen = ref(false);

const selected = computed(() =>
  props.actions.find((action) => action.key === selectedKey.value),
);
const canRun = computed(
  () =>
    !!selected.value &&
    props.ids.length > 0 &&
    (selected.value.isValid?.(value.value) ?? true),
);

function pick(action: BulkAction) {
  if (selectedKey.value === action.key) return;
  selectedKey.value = action.key;
  value.value = action.initialValue?.();
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  selectedKey.value = undefined;
  value.value = undefined;
  confirmOpen.value = false;
});

function onDone(result: BulkRunResult) {
  open.value = false;
  emit('done', result);
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent width="medium" data-test="bulk-action-sheet">
      <SheetHeader>
        <SheetTitle>{{ $t('bulk_action') }}</SheetTitle>
        <SheetDescription>
          {{
            $t(
              'count_entity_selected',
              { count: ids.length, entityKey },
              ids.length,
            )
          }}
        </SheetDescription>
      </SheetHeader>

      <SheetBody
        class="flex min-h-0 flex-1 flex-col p-0 sm:flex-row sm:overflow-hidden sm:p-0"
      >
        <div
          class="flex shrink-0 flex-col gap-4 border-b p-4 sm:w-60 sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-6"
        >
          <p class="text-sm font-semibold">{{ $t('choose_action') }}</p>
          <ul class="flex flex-col gap-0.5">
            <li v-for="action in actions" :key="action.key">
              <button
                type="button"
                :class="
                  cn(
                    'hover:bg-secondary flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm outline-hidden focus-visible:ring-2',
                    selectedKey === action.key && 'bg-secondary font-medium',
                  )
                "
                :aria-current="selectedKey === action.key || undefined"
                data-test="bulk-action-row"
                @click="pick(action)"
              >
                <component
                  :is="resolveIcon(action.icon)"
                  class="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
                <span class="flex-1 truncate">{{ action.label }}</span>
                <LucideChevronRight
                  class="text-muted-foreground size-4 shrink-0"
                  aria-hidden="true"
                />
              </button>
            </li>
          </ul>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:overflow-y-auto sm:p-6"
        >
          <p class="text-sm font-semibold">{{ $t('properties') }}</p>
          <component
            :is="selected.component"
            v-if="selected?.component"
            v-model="value"
            v-bind="selected.componentProps"
          />
          <p v-else class="text-muted-foreground text-sm">
            {{
              selected
                ? $t('bulk_action_no_properties')
                : $t('bulk_action_pick_hint')
            }}
          </p>
        </div>
      </SheetBody>

      <SheetFooter>
        <Button variant="secondary" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <Button
          :disabled="!canRun"
          data-test="bulk-action-run"
          @click="confirmOpen = true"
        >
          {{ $t('run_bulk_action') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <ListBulkActionConfirm
    v-model:open="confirmOpen"
    :action="selected"
    :value="value"
    :ids="ids"
    :entity-key="entityKey"
    :scope-note="scopeNote"
    @done="onDone"
  />
</template>
