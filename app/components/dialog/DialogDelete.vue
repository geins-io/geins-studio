<script setup lang="ts">
const props = defineProps<{
  entityKey: string;
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
        <AlertDialogTitle>
          {{ $t('dialog.delete_confirm_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t('dialog.delete_confirm_description', {
              entityKey: $t(props.entityKey),
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
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
