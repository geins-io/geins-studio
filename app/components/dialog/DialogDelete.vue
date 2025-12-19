<script setup lang="ts">
const props = defineProps<{
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
          $t('dialog.delete_confirm_title')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t('dialog.delete_confirm_description', {
              entityName: $t(props.entityName),
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="$emit('cancel')">{{
          $t('cancel')
        }}</AlertDialogCancel>

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
