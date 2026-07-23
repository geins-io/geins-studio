<script setup lang="ts">
import type { Asset } from '#shared/types';
import { formatFileSize } from '#shared/utils/file';

/**
 * Grid tile for a single asset: thumbnail, name, type badge, folder, tags, and
 * size/modified meta. Click (name or card) or the action menu opens the asset.
 * Selection + bulk actions are deferred post-v0, so no select checkbox yet.
 */
const props = defineProps<{
  asset: Asset;
  /** Resolved folder name (the asset only carries `folderId`). */
  folderName?: string;
}>();

const emit = defineEmits<{ open: [] }>();

const { formatDate } = useDate();
const size = computed(() => formatFileSize(props.asset.sizeBytes));
</script>

<template>
  <Card
    class="group hover:border-ring/40 gap-0 overflow-hidden py-0 transition-colors hover:shadow-sm"
  >
    <div class="relative">
      <AssetThumbnail
        :type="asset.type"
        :thumb-url="asset.thumbUrl"
        :alt="asset.name"
        size="card"
        class="rounded-none"
      />
      <div
        class="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon-xs">
              <LucideEllipsis class="size-4" />
              <span class="sr-only">{{ $t('actions') }}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="emit('open')">
              <LucideEye class="size-4" />
              {{ $t('view_details') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div class="flex flex-col gap-2 p-3">
      <button
        type="button"
        class="truncate text-left text-sm font-medium hover:underline"
        @click="emit('open')"
      >
        {{ asset.name }}
      </button>

      <div>
        <AssetTypeBadge :type="asset.type" />
      </div>

      <div
        v-if="folderName"
        class="text-muted-foreground flex items-center gap-1.5 text-xs"
      >
        <LucideFolder class="size-3 shrink-0" />
        <span class="truncate">{{ folderName }}</span>
      </div>

      <div v-if="asset.tags.length" class="flex items-center gap-1.5">
        <LucideTag class="text-muted-foreground size-3 shrink-0" />
        <div class="flex flex-wrap items-center gap-1.5">
          <Tag v-for="tag in asset.tags" :key="tag" :label="tag" size="sm" />
        </div>
      </div>

      <div
        class="text-muted-foreground flex items-center justify-between text-xs"
      >
        <span>{{ size }}</span>
        <span>{{ formatDate(asset.updatedAt, { dateStyle: 'medium' }) }}</span>
      </div>
    </div>
  </Card>
</template>
