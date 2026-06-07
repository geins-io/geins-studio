<script setup lang="ts">
import type { KitInstallation } from '#shared/types';

const props = defineProps<{
  open: boolean;
  installation: KitInstallation | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [payload: { workflows?: string[]; deleteVariables: boolean }];
}>();

const deleteVariables = ref(false);
const selected = ref<Record<string, boolean>>({});

const workflows = computed(() => props.installation?.workflows ?? []);
const hasVariables = computed(
  () => (props.installation?.variables ?? []).length > 0,
);

watch(
  () => [props.open, props.installation] as const,
  ([open]) => {
    if (!open) return;
    deleteVariables.value = false;
    selected.value = Object.fromEntries(
      workflows.value.map((w) => [w.refId, true]),
    );
  },
  { immediate: true },
);

const selectedRefs = computed(() =>
  workflows.value.filter((w) => selected.value[w.refId]).map((w) => w.refId),
);

const allSelected = computed(
  () =>
    workflows.value.length > 0 &&
    selectedRefs.value.length === workflows.value.length,
);

const canConfirm = computed(() => selectedRefs.value.length > 0);

const onConfirm = () => {
  if (!canConfirm.value || props.loading) return;
  emit('confirm', {
    // Omit when removing everything so the API uninstalls the whole kit.
    workflows: allSelected.value ? undefined : selectedRefs.value,
    deleteVariables: deleteVariables.value,
  });
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{
            installation
              ? $t('kits.uninstall_titled', { name: installation.kitName })
              : $t('kits.uninstall')
          }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('kits.uninstall_description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3 py-1">
        <div v-if="workflows.length" class="space-y-2">
          <p class="text-sm font-medium">
            {{ $t('kits.workflows_to_remove') }}
          </p>
          <div
            v-for="w in workflows"
            :key="w.refId"
            class="flex items-center gap-3 rounded-md border px-3 py-2"
          >
            <Checkbox
              :id="`rm-${w.refId}`"
              :model-value="!!selected[w.refId]"
              @update:model-value="
                selected = { ...selected, [w.refId]: !!$event }
              "
            />
            <label :for="`rm-${w.refId}`" class="flex-1 cursor-pointer text-sm">
              {{ w.workflowName }}
            </label>
          </div>
        </div>

        <label
          v-if="hasVariables"
          class="flex items-start gap-3 rounded-md border px-3 py-2"
        >
          <Checkbox
            :model-value="deleteVariables"
            class="mt-0.5"
            @update:model-value="deleteVariables = !!$event"
          />
          <span class="flex-1 text-sm">
            <span class="block font-medium">
              {{ $t('kits.delete_variables') }}
            </span>
            <span class="text-muted-foreground block text-xs">
              {{ $t('kits.delete_variables_description') }}
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
        <Button
          variant="destructive"
          :disabled="!canConfirm || loading"
          @click="onConfirm"
        >
          <LucideLoader v-if="loading" class="mr-1.5 size-3.5 animate-spin" />
          <LucideTrash2 v-else class="mr-1.5 size-3.5" />
          {{ $t('kits.uninstall') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
