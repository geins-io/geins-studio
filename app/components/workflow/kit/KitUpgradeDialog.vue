<script setup lang="ts">
import type { KitInstallation } from '#shared/types';

const props = defineProps<{
  open: boolean;
  installation: KitInstallation | null;
  latestVersion?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [payload: { force: boolean }];
}>();

const force = ref(false);

watch(
  () => props.open,
  (open) => {
    if (open) force.value = false;
  },
);

const onConfirm = () => {
  if (props.loading) return;
  emit('confirm', { force: force.value });
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{
            installation
              ? $t('kits.upgrade_titled', { name: installation.kitName })
              : $t('kits.upgrade')
          }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('kits.upgrade_description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3 py-1">
        <div
          v-if="installation"
          class="bg-muted/40 flex items-center justify-center gap-3 rounded-md border py-3 text-sm"
        >
          <span class="text-muted-foreground">
            v{{ installation.kitVersion }}
          </span>
          <LucideArrowRight class="text-muted-foreground size-4" />
          <span class="text-foreground font-semibold">
            v{{ latestVersion ?? '—' }}
          </span>
        </div>

        <label class="flex items-start gap-3 rounded-md border px-3 py-2">
          <Checkbox
            :model-value="force"
            class="mt-0.5"
            @update:model-value="force = !!$event"
          />
          <span class="flex-1 text-sm">
            <span class="block font-medium">
              {{ $t('kits.force_upgrade') }}
            </span>
            <span class="text-muted-foreground block text-xs">
              {{ $t('kits.force_upgrade_description') }}
            </span>
          </span>
        </label>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          {{ $t('cancel') }}
        </Button>
        <Button :disabled="loading" @click="onConfirm">
          <LucideLoader v-if="loading" class="mr-1.5 size-3.5 animate-spin" />
          <LucideArrowUpCircle v-else class="mr-1.5 size-3.5" />
          {{ $t('kits.upgrade') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
