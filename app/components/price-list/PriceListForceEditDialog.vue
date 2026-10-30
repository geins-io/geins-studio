<script setup lang="ts">
const props = defineProps<{
  /** Replaces the default title. Already translated. */
  title?: string;
  /** Replaces the default description. Already translated. */
  description?: string;
}>();
const open = defineModel('open', {
  type: Boolean,
  default: false,
});
const emit = defineEmits<{ confirm: [] }>();
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ props.title ?? $t('pricing.price_list_force_edit_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            props.description ?? $t('pricing.price_list_force_edit_description')
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ $t('cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')">
          {{ $t('edit_anyway') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
