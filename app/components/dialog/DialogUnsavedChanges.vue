<script setup lang="ts">
const _props = defineProps<{
  entityName: string;
  loading: boolean;
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
        <AlertDialogTitle>{{
          $t('dialog.unsaved_changes_title')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('dialog.unsaved_changes_description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="$emit('cancel')">{{
          $t('cancel')
        }}</AlertDialogCancel>

        <Button :loading="loading" @click.prevent.stop="$emit('confirm')">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
