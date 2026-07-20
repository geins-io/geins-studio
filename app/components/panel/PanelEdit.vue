<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';

/**
 * Reusable slide-in edit panel — the standard shell for route-less entity
 * editing (asset detail, company buyer, …). Wraps the shadcn `Sheet` with a
 * standard header/body/footer and an opt-in unsaved-changes guard.
 *
 * Unsaved changes are NOT tracked here: pass `:dirty` (e.g. vee-validate's
 * `form.meta.value.dirty`). When dirty, any close attempt (X, Esc, overlay,
 * Cancel) is intercepted and routed through `DialogUnsavedChanges`; confirming
 * emits `discard` and closes. This keeps the single source of dirty state in
 * the consumer's form and reuses the shared dialog (no per-panel tracking).
 */
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    width?: 'narrow' | 'medium' | 'wide';
    /** When true, closing prompts via DialogUnsavedChanges first. */
    dirty?: boolean;
    /** Save button spinner + blocks the unsaved guard mid-save. */
    loading?: boolean;
    saveDisabled?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    hideFooter?: boolean;
    /** Forwarded to DialogUnsavedChanges. */
    entityKey?: string;
  }>(),
  {
    width: 'medium',
    dirty: false,
    loading: false,
    saveDisabled: false,
    hideFooter: false,
  },
);

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  save: [];
  /** User confirmed discarding unsaved changes. */
  discard: [];
}>();

const unsavedOpen = ref(false);

function requestClose() {
  if (props.dirty && !props.loading) {
    unsavedOpen.value = true;
    return;
  }
  open.value = false;
}

// Reka drives close via update:open(false) for X / Esc / overlay — funnel them
// all through the guard. Opening always propagates.
function onOpenChange(next: boolean) {
  if (next) {
    open.value = true;
    return;
  }
  requestClose();
}

function confirmDiscard() {
  unsavedOpen.value = false;
  emit('discard');
  open.value = false;
}
</script>

<template>
  <Sheet :open="open" @update:open="onOpenChange">
    <SheetTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </SheetTrigger>
    <SheetContent :width="width">
      <SheetHeader>
        <SheetTitle>{{ title }}</SheetTitle>
        <SheetDescription v-if="description">
          {{ description }}
        </SheetDescription>
        <VisuallyHidden v-else>
          <SheetDescription>{{ title }}</SheetDescription>
        </VisuallyHidden>
      </SheetHeader>

      <SheetBody>
        <slot />
      </SheetBody>

      <SheetFooter v-if="!hideFooter">
        <slot name="footer">
          <Button variant="outline" @click="requestClose">
            {{ cancelLabel ?? $t('cancel') }}
          </Button>
          <Button
            :loading="loading"
            :disabled="saveDisabled"
            @click.stop="emit('save')"
          >
            {{ saveLabel ?? $t('save') }}
          </Button>
        </slot>
      </SheetFooter>
    </SheetContent>

    <DialogUnsavedChanges
      v-model:open="unsavedOpen"
      :entity-key="entityKey ?? ''"
      :loading="false"
      @confirm="confirmDiscard"
    />
  </Sheet>
</template>
