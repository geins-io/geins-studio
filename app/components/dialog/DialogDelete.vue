<script setup lang="ts">
const props = defineProps<{
  entityKey: string;
  loading: boolean;
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
          {{ $t('dialog.delete_confirm_title') }}
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
          variant="destructive"
          @click.prevent.stop="$emit('confirm')"
        >
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
