<script setup lang="ts">
import type { ButtonVariants } from '@/components/ui/button';

const props = defineProps<{
  entityKey: string;
  loading: boolean;
  /** Replaces the default title. Already translated. */
  title?: string;
  /**
   * Replaces the default confirm line. Needed when the default's permanence
   * claim isn't true for the entity — e.g. a backend that soft-deletes.
   */
  description?: string;
  /**
   * Optional caution callout (e.g. an asset used in several places). Both are
   * needed to render it — a `Feedback` with this title + description.
   */
  warningTitle?: string;
  warningDescription?: string;
  /** Replaces the confirm button's default "Continue". Already translated. */
  confirmLabel?: string;
  /** Confirm button variant. A soft delete (e.g. move to trash) isn't red. */
  confirmVariant?: ButtonVariants['variant'];
}>();
const open = defineModel('open', {
  type: Boolean,
  default: false,
});
const _emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ props.title ?? $t('dialog.delete_confirm_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            props.description ??
            $t('dialog.delete_confirm_description', {
              entityKey: props.entityKey,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <Feedback v-if="props.warningTitle" type="warning">
        <template #title>{{ props.warningTitle }}</template>
        <template #description>{{ props.warningDescription }}</template>
      </Feedback>
      <AlertDialogFooter>
        <AlertDialogCancel @click="$emit('cancel')">
          {{ $t('cancel') }}
        </AlertDialogCancel>

        <Button
          :loading="loading"
          :variant="props.confirmVariant ?? 'destructive'"
          @click.prevent.stop="$emit('confirm')"
        >
          {{ props.confirmLabel ?? $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
