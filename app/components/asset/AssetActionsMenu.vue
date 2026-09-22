<script setup lang="ts">
import type { Asset } from '#shared/types';

/**
 * Shared asset context menu (view / download / copy URL / delete) so the grid
 * card and the list-view actions column render identical items + emits.
 * Download / copy URL are disabled when the asset has no public `url`.
 *
 * In `trashed` mode the menu collapses to a single **Restore** item: a trashed
 * asset can only come back, and its stored file may already be unreachable, so
 * offering details / download / delete there would be dead ends.
 */
withDefaults(
  defineProps<{
    asset: Asset;
    /** Trigger styling: floating chip on the grid card vs. table-row button. */
    trigger?: 'card' | 'table';
    /** Trash view — the asset is soft-deleted, so Restore is the only action. */
    trashed?: boolean;
  }>(),
  { trigger: 'card', trashed: false },
);

const emit = defineEmits<{
  open: [];
  download: [];
  copyUrl: [];
  delete: [];
  restore: [];
}>();
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        v-if="trigger === 'table'"
        variant="outline"
        size="xs"
        class="size-6 p-1 sm:size-7"
      >
        <LucideMoreHorizontal class="size-3.5" aria-hidden="true" />
        <span class="sr-only">{{ $t('actions') }}</span>
      </Button>
      <Button v-else variant="secondary" size="icon-xs">
        <LucideEllipsis class="size-4" aria-hidden="true" />
        <span class="sr-only">{{ $t('actions') }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem v-if="trashed" @click="emit('restore')">
        <LucideUndo2 class="mr-2 size-4" aria-hidden="true" />
        <span>{{ $t('restore') }}</span>
      </DropdownMenuItem>

      <template v-else>
        <DropdownMenuItem @click="emit('open')">
          <LucideEye class="mr-2 size-4" aria-hidden="true" />
          <span>{{ $t('asset_library.view_details') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!asset.url" @click="emit('download')">
          <LucideDownload class="mr-2 size-4" aria-hidden="true" />
          <span>{{ $t('download') }}</span>
        </DropdownMenuItem>
        <DropdownMenuItem :disabled="!asset.url" @click="emit('copyUrl')">
          <LucideCopy class="mr-2 size-4" aria-hidden="true" />
          <span>{{ $t('asset_library.copy_public_url') }}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="emit('delete')">
          <LucideTrash2 class="mr-2 size-4" aria-hidden="true" />
          <span>{{ $t('delete_entity', { entityKey: 'asset' }) }}</span>
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
