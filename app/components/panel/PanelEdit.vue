<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';

/**
 * Reusable slide-in edit panel — the standard shell for route-less entity
 * editing (asset detail, company buyer, …).
 *
 * Panel-on-panel is automatic (no per-consumer wiring): the first panel opens
 * as a modal Reka `Sheet`; any panel opened while another is already open
 * renders as a stacked `inline` slide-over and `<Teleport>`s into the bottom
 * sheet's content container (registered via `usePanelStack`). That keeps stacked
 * panels inside the base's modal subtree — Reka's `hideOthers` never hides them
 * and its focus trap reaches them — while the base stays `modal` throughout, so
 * Reka never swaps its Dialog content (which would remount + wipe child fields).
 * While a panel is above, the one below recedes (shift-left + dim) and goes
 * `inert`; a click-catcher over it closes the top panel (through the guard).
 *
 * Unsaved changes are NOT tracked here: pass `:dirty` (e.g. `usePanelDirty`).
 * When dirty, any close attempt (X, Esc, overlay, Cancel, backdrop) is routed
 * through `DialogUnsavedChanges`; confirming emits `discard` and closes.
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

const { index, hasPanelAbove, isStacked, stackTarget, registerTarget } =
  usePanelStack(open);

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

// Stacked panels layer by stack position (base sheet is z-50).
const stackZ = computed(() => 50 + index.value * 10);

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
  <!-- Bottom panel: a modal Sheet that also hosts the teleport target for any
       stacked panels. -->
  <Sheet
    v-if="!isStacked"
    :open="open"
    :modal="true"
    @update:open="onOpenChange"
  >
    <SheetTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </SheetTrigger>
    <!-- bg/shadow live on the inner wrapper so the WHOLE card recedes as one
         unit; SheetContent stays visually neutral because a transform/filter on
         it would drag the `fixed` stacked panels (descendants) along too. -->
    <SheetContent :width="width" class="bg-transparent shadow-none">
      <div
        class="bg-card flex h-full min-h-0 w-full flex-col shadow-lg transition-transform duration-300 ease-in-out"
        :class="
          hasPanelAbove &&
          'pointer-events-none translate-x-[-72px] brightness-95'
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

      <!-- Teleport destination for stacked panels (sibling of the receding
           wrapper, so it is not transformed with it). -->
      <div :ref="registerTarget" />
    </SheetContent>

    <DialogUnsavedChanges
      v-model:open="unsavedOpen"
      :entity-key="entityKey ?? ''"
      :loading="false"
      @confirm="confirmDiscard"
    />
  </Sheet>

  <!-- Stacked panel: a plain slide-over teleported into the bottom sheet's
       container so it shares the modal subtree. -->
  <Teleport v-else :to="stackTarget" :disabled="!stackTarget">
    <!-- Click-catcher over the receded panel below: closes this one (guarded). -->
    <div
      v-if="open"
      class="fixed inset-0"
      :style="{ zIndex: stackZ - 5 }"
      @click="requestClose"
    />
    <div
      role="dialog"
      :style="{ zIndex: stackZ }"
      :class="[
        widthClass,
        'bg-card fixed inset-y-0 right-0 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        hasPanelAbove &&
          'pointer-events-none translate-x-[-72px] brightness-95',
      ]"
      :inert="hasPanelAbove"
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
  </Teleport>
</template>
