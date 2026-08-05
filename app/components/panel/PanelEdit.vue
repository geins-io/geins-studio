<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';

/**
 * Reusable slide-in edit panel — the standard shell for route-less entity
 * editing (asset detail, company buyer, …). Two variants share one set of
 * header/body/footer + unsaved-changes logic:
 *
 * - `sheet` (default): a modal Reka `Sheet`, for a top-level panel.
 * - `inline`: a plain `fixed` slide-over (no Reka Dialog), for a panel that
 *   STACKS on top of a `sheet`. It is placed inside the base sheet's content
 *   (via the base's `#stack` slot) so it lives within the base's modal subtree
 *   — Reka's `hideOthers` therefore never hides it and the base's focus trap
 *   still reaches it. Crucially the base panel stays `modal` the whole time, so
 *   Reka never swaps its Dialog content component (modal ↔ non-modal) and the
 *   base is never remounted. Remounting used to wipe every child `FormField`
 *   and reset `form.meta.dirty` — see the panel-on-panel dirty gotcha.
 *
 * Unsaved changes are NOT tracked here: pass `:dirty` (e.g. vee-validate's
 * `form.meta.value.dirty`, or a snapshot compare). When dirty, any close attempt
 * (X, Esc, overlay, Cancel) is intercepted and routed through
 * `DialogUnsavedChanges`; confirming emits `discard` and closes.
 *
 * A `sheet` panel exposes a `#stack` slot for its stacked (`inline`) children
 * and recedes its own content (`hasPanelAbove`) while one is open.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    variant?: 'sheet' | 'inline';
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
    variant: 'sheet',
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

// A `sheet` base recedes while a stacked (`inline`) panel is open. Both variants
// register here so an inline child's open state drives its base's hasPanelAbove.
const { hasPanelAbove } = usePanelStack(open);

const unsavedOpen = ref(false);

const widthClass = computed(() => {
  switch (props.width) {
    case 'wide':
      return 'w-[100vw] max-w-[1310px]';
    case 'medium':
      return 'w-[96vw] max-w-[785px]';
    default:
      return 'w-[96vw] max-w-[550px]';
  }
});

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
  <Sheet
    v-if="variant === 'sheet'"
    :open="open"
    :modal="true"
    @update:open="onOpenChange"
  >
    <SheetTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </SheetTrigger>
    <!-- bg/shadow live on the inner wrapper so the WHOLE card recedes as one
         unit; SheetContent stays visually neutral because a transform/filter on
         it would drag the `fixed` #stack slide-over (a descendant) along too. -->
    <SheetContent :width="width" class="bg-transparent shadow-none">
      <div
        class="bg-card flex h-full min-h-0 w-full flex-col shadow-lg transition-transform duration-300 ease-in-out"
        :class="
          hasPanelAbove &&
          'pointer-events-none -translate-x-[72px] brightness-95'
        "
        :inert="hasPanelAbove"
      >
        <SheetHeader>
          <SheetTitle>{{ title }}</SheetTitle>
          <SheetDescription v-if="description">
            {{ description }}
          </SheetDescription>
          <VisuallyHidden v-else>
            <SheetDescription>{{ title }}</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>

        <SheetBody class="min-h-0 flex-1">
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
      </div>

      <slot name="stack" />
    </SheetContent>

    <DialogUnsavedChanges
      v-model:open="unsavedOpen"
      :entity-key="entityKey ?? ''"
      :loading="false"
      @confirm="confirmDiscard"
    />
  </Sheet>

  <!-- inline: stacked slide-over rendered inside the base sheet's content -->
  <template v-else>
    <!-- Click-catcher over the receded base panel: closes this panel (through
         the unsaved guard), like a scrim dismiss. -->
    <div v-if="open" class="fixed inset-0 z-[55]" @click="requestClose" />
    <div
      role="dialog"
      :class="[
        widthClass,
        'bg-card fixed inset-y-0 right-0 z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      ]"
    >
      <div class="flex flex-col gap-y-2 border-b p-4">
        <h2 class="text-foreground text-xl font-semibold sm:text-2xl">
          {{ title }}
        </h2>
        <p v-if="description" class="text-muted-foreground text-sm">
          {{ description }}
        </p>
      </div>

      <SheetBody class="min-h-0 flex-1">
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

      <button
        type="button"
        class="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
        :aria-label="$t('close')"
        @click="requestClose"
      >
        <LucideX class="size-4" />
      </button>
    </div>

    <DialogUnsavedChanges
      v-model:open="unsavedOpen"
      :entity-key="entityKey ?? ''"
      :loading="false"
      @confirm="confirmDiscard"
    />
  </template>
</template>
