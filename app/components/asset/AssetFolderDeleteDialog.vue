<script setup lang="ts">
import type { FolderDeleteAction } from '#shared/types';
import { TRASH_RETENTION_DAYS } from '#shared/utils/asset';

/**
 * Options for deleting a folder that isn't empty: move it to the trash with
 * everything in it (default), move its assets to uncategorised, or delete it
 * permanently. Each takes the whole subtree. Empty folders never reach here
 * (the tree's plain `DialogDelete` deletes them). Only the permanent delete's
 * confirm is red.
 */
const props = defineProps<{
  folderName: string;
  /**
   * Live assets in the folder + its subtree, or `null` when the count failed.
   * `0` hides the relocate option (nothing to move).
   */
  count: number | null;
  loading?: boolean;
}>();

const open = defineModel<boolean>('open', { default: false });
/** Why the last attempt failed, already translated. Cleared on a new choice. */
const error = defineModel<string | undefined>('error');

const emit = defineEmits<{
  confirm: [action: FolderDeleteAction];
  cancel: [];
}>();

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

const action = ref<FolderDeleteAction>('trash');
watch(open, (value) => {
  if (value) action.value = 'trash';
});
watch(action, () => {
  error.value = undefined;
});

interface Option {
  id: FolderDeleteAction;
  icon: string;
  title: string;
  description: string;
}

const options = computed<Option[]>(() => {
  const all: Option[] = [
    {
      id: 'trash',
      icon: 'Trash2',
      title: t('asset_library.move_to_trash'),
      description: `${t('asset_library.folder_delete_trash_description')} ${t(
        'asset_library.trash_restore_note',
        { days: TRASH_RETENTION_DAYS },
        2,
      )}`,
    },
    {
      id: 'relocate',
      icon: 'FolderInput',
      title: t('asset_library.folder_delete_relocate_title'),
      description: t('asset_library.folder_delete_relocate_description'),
    },
    {
      id: 'purge',
      icon: 'Ban',
      title: t('asset_library.delete_permanently'),
      description: `${t('asset_library.folder_delete_purge_description')} ${t(
        'asset_library.purge_note',
      )}`,
    },
  ];
  return props.count === 0 ? all.filter((o) => o.id !== 'relocate') : all;
});

const selected = computed(
  () => options.value.find((o) => o.id === action.value) ?? options.value[0]!,
);

const intro = computed(() =>
  props.count
    ? t(
        'asset_library.folder_delete_intro',
        {
          assets: t(
            'nr_of_entity',
            { count: props.count, entityKey: 'asset' },
            props.count,
          ),
        },
        props.count,
      )
    : t('asset_library.folder_delete_intro_other'),
);

// Every option says what it does beyond its one-liner: relocate breaks links,
// the other two take the assets off everything that uses them.
const callout = computed(() =>
  action.value === 'relocate'
    ? {
        title: t('asset_library.bulk_move_url_title'),
        description: t('asset_library.bulk_move_url_description'),
      }
    : {
        title: t('asset_library.removing_everywhere'),
        description: t('asset_library.remove_everywhere_description', 2),
      },
);
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ $t('asset_library.delete_folder_title', { name: folderName }) }}
        </DialogTitle>
        <DialogDescription>{{ intro }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-3" role="radiogroup">
        <button
          v-for="option in options"
          :key="option.id"
          type="button"
          role="radio"
          :aria-checked="action === option.id"
          class="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors"
          :class="
            action === option.id
              ? 'border-primary bg-muted/30'
              : 'hover:bg-muted/40'
          "
          @click="action = option.id"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg"
            :class="
              action === option.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground'
            "
          >
            <component
              :is="resolveIcon(option.icon)"
              class="size-5"
              aria-hidden="true"
            />
          </div>
          <div class="flex-1">
            <div class="font-semibold">{{ option.title }}</div>
            <p class="text-muted-foreground mt-0.5 text-sm">
              {{ option.description }}
            </p>
          </div>
          <span
            class="flex size-5 shrink-0 items-center justify-center self-center rounded-full border"
            :class="action === option.id ? 'border-primary' : 'border-input'"
          >
            <span
              v-if="action === option.id"
              class="bg-primary size-2.5 rounded-full"
            />
          </span>
        </button>
      </div>

      <Feedback v-if="error" type="negative">
        <template #title>
          {{ $t('error_deleting_entity', { entityKey: 'folder' }) }}
        </template>
        <template #description>{{ error }}</template>
      </Feedback>
      <Feedback v-else type="warning">
        <template #title>{{ callout.title }}</template>
        <template #description>{{ callout.description }}</template>
      </Feedback>

      <DialogFooter class="sm:justify-between">
        <Button variant="ghost" @click="emit('cancel')">
          {{ $t('cancel') }}
        </Button>
        <Button
          :loading="loading"
          :variant="selected.id === 'purge' ? 'destructive' : 'default'"
          @click="emit('confirm', selected.id)"
        >
          {{ selected.title }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
