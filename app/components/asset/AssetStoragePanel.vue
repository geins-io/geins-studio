<script setup lang="ts">
import { formatFileSize } from '#shared/utils/file';

/**
 * Read-only storage panel for the Assets Library: storage used (against the
 * limit, when the account has one) plus a breakdown by asset type or by folder,
 * each row a labelled Progress bar. Opened from the header's storage summary.
 */
const open = defineModel<boolean>('open', { default: false });

const { storage, error, refresh } = useAssetStorage();
const { formatRelativeDate } = useDate();

// Figures are at most an hour old, but an upload or delete since the page
// loaded moves them — re-read on every open.
watch(open, (isOpen) => {
  if (isOpen) refresh();
});

const tab = ref<'type' | 'folder'>('type');
const segments = computed(() =>
  tab.value === 'folder'
    ? (storage.value?.byFolder ?? [])
    : (storage.value?.byType ?? []),
);
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent width="narrow">
      <SheetHeader>
        <SheetTitle>{{ $t('asset_library.storage.title') }}</SheetTitle>
        <SheetDescription class="sr-only">
          {{ $t('asset_library.storage.description') }}
        </SheetDescription>
      </SheetHeader>

      <SheetBody class="space-y-6">
        <Empty v-if="error && !storage" class="mt-12">
          <EmptyHeader>
            <EmptyMedia variant="destructive">
              <LucideCircleAlert />
            </EmptyMedia>
            <EmptyTitle>
              {{
                $t('error_loading_entity', {
                  entityKey: 'asset_library.storage.title',
                })
              }}
            </EmptyTitle>
            <EmptyDescription>
              {{ $t('error_empty_description') }}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ButtonIcon icon="retry" variant="secondary" @click="refresh()">
              {{ $t('retry') }}
            </ButtonIcon>
          </EmptyContent>
        </Empty>

        <template v-else-if="storage">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <LucideHardDrive
                class="text-muted-foreground size-6 shrink-0"
                aria-hidden="true"
              />
              <p class="text-2xl font-semibold">
                {{ formatFileSize(storage.usedBytes) }}
                <span class="text-muted-foreground text-base font-normal">
                  {{
                    storage.totalBytes === null
                      ? $t('asset_library.storage.used')
                      : $t('asset_library.storage.of_used', {
                          total: formatFileSize(storage.totalBytes),
                        })
                  }}
                </span>
              </p>
            </div>
            <Progress
              v-if="storage.usedPct !== null"
              :model-value="storage.usedPct"
            />
          </div>

          <div class="my-8 border-t" />

          <Tabs v-model="tab">
            <TabsList>
              <TabsTrigger value="type">
                {{ $t('asset_library.storage.by_type') }}
              </TabsTrigger>
              <TabsTrigger value="folder">{{ $t('folder', 2) }}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Empty v-if="!storage.breakdownReadAt">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LucideChartPie />
              </EmptyMedia>
              <EmptyTitle>
                {{ $t('asset_library.storage.breakdown_unavailable') }}
              </EmptyTitle>
              <EmptyDescription>
                {{
                  $t('asset_library.storage.breakdown_unavailable_description')
                }}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>

          <Empty v-else-if="!segments.length">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LucideImage />
              </EmptyMedia>
              <EmptyTitle>
                {{ $t('no_entity', { entityKey: 'asset' }, 2) }}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>

          <div v-else class="space-y-6">
            <div v-for="seg in segments" :key="seg.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ seg.label }}</span>
                <span class="text-muted-foreground tabular-nums">
                  <span class="text-foreground">
                    {{ formatFileSize(seg.bytes) }}
                  </span>
                  · {{ seg.pct }}%
                </span>
              </div>
              <Progress
                :model-value="seg.pct"
                :indicator-class="seg.indicatorClass"
                class="h-1.5"
              />
            </div>
            <p class="text-muted-foreground text-xs">
              {{
                $t('asset_library.storage.updated', {
                  time: formatRelativeDate(storage.breakdownReadAt),
                })
              }}
            </p>
          </div>
        </template>

        <div v-else class="space-y-2">
          <Skeleton class="h-8 w-48" />
          <Skeleton class="h-2 w-full" />
        </div>
      </SheetBody>

      <SheetFooter>
        <SheetClose as-child>
          <Button variant="outline" class="w-full">{{ $t('close') }}</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
