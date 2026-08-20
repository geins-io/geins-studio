<script setup lang="ts">
import type { FolderDeleteAssets } from '#shared/types';

/**
 * Folder-delete dialog shown when the folder (or its subtree) still holds
 * assets: the user picks what happens to them — keep + move to uncategorised,
 * or delete them too. Empty folders never reach here (the tree shows the plain
 * `DialogDelete` confirm instead). The count is resolved by the caller.
 */
const props = defineProps<{
  folderName: string;
  /** Assets in the folder + its subtree — drives the copy and pluralization. */
  count: number;
  loading?: boolean;
}>();

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  confirm: [assets: FolderDeleteAssets];
  cancel: [];
}>();

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

// Default to the safe option; reset each time the dialog opens.
const disposition = ref<FolderDeleteAssets>('move');
watch(open, (value) => {
  if (value) disposition.value = 'move';
});

const OPTIONS = [
  { id: 'move', icon: 'FolderInput' },
  { id: 'delete', icon: 'Trash2' },
] as const;

// "3 assets" / "1 asset" — reuse the shared count+entity key.
const assetCount = computed(() =>
  t('nr_of_entity', { count: props.count, entityKey: 'asset' }, props.count),
);

function confirm() {
  emit('confirm', disposition.value);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ $t('delete_folder_title', { name: folderName }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t('folder_delete_intro', { assets: assetCount }, count) }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3">
        <button
          v-for="option in OPTIONS"
          :key="option.id"
          type="button"
          class="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors"
          :class="
            disposition === option.id
              ? option.id === 'delete'
                ? 'border-destructive bg-destructive/5'
                : 'border-primary bg-muted/30'
              : 'hover:bg-muted/40'
          "
          @click="disposition = option.id"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg"
            :class="
              option.id === 'delete'
                ? disposition === 'delete'
                  ? 'bg-destructive text-white'
                  : 'bg-destructive/10 text-destructive'
                : disposition === 'move'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
            "
          >
            <component :is="resolveIcon(option.icon)" class="size-5" />
          </div>
          <div class="flex-1">
            <div
              class="font-semibold"
              :class="option.id === 'delete' && 'text-destructive'"
            >
              {{ $t(`folder_delete_${option.id}_title`) }}
            </div>
            <p class="text-muted-foreground mt-0.5 text-sm">
              {{ $t(`folder_delete_${option.id}_description`) }}
            </p>
          </div>
          <span
            class="flex size-5 shrink-0 items-center justify-center self-center rounded-full border"
            :class="
              disposition === option.id
                ? option.id === 'delete'
                  ? 'border-destructive'
                  : 'border-primary'
                : 'border-input'
            "
          >
            <span
              v-if="disposition === option.id"
              class="size-2.5 rounded-full"
              :class="option.id === 'delete' ? 'bg-destructive' : 'bg-primary'"
            />
          </span>
        </button>
      </div>

      <Feedback v-if="disposition === 'delete'" type="warning">
        <template #title>{{ $t('removing_everywhere') }}</template>
        <template #description>
          {{ $t('remove_everywhere_description', count) }}
        </template>
      </Feedback>

      <DialogFooter class="sm:justify-between">
        <Button variant="ghost" @click="emit('cancel')">
          {{ $t('cancel') }}
        </Button>
        <Button
          :loading="loading"
          :variant="disposition === 'delete' ? 'destructive' : 'default'"
          @click="confirm"
        >
          {{ $t('delete_entity', { entityKey: 'folder' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
