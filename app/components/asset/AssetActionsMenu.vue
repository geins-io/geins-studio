<script setup lang="ts">
import type { Asset } from '#shared/types';

/**
 * Shared asset context menu (view / download / copy URL / delete) so the grid
 * card and the list-view actions column render identical items + emits.
 * Download / copy URL are disabled when the asset has no public `url`.
 */
withDefaults(
  defineProps<{
    asset: Asset;
    /** Trigger styling: floating chip on the grid card vs. table-row button. */
    trigger?: 'card' | 'table';
    /** Gated off (disabled) when the backend can't delete — see useAssetCapabilities. */
    canDelete?: boolean;
  }>(),
  { trigger: 'card', canDelete: true },
);

const emit = defineEmits<{
  open: [];
  download: [];
  copyUrl: [];
  delete: [];
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
      <DropdownMenuItem :disabled="!canDelete" @click="emit('delete')">
        <LucideTrash2 class="mr-2 size-4" aria-hidden="true" />
        <span>{{ $t('delete_entity', { entityKey: 'asset' }) }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
