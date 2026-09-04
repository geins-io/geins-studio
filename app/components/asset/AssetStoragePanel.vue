<script setup lang="ts">
import { formatFileSize } from '#shared/utils/file';

/**
 * Read-only storage panel for the Assets Library: total quota usage plus a
 * breakdown by asset type or by folder, each row a labelled Progress bar.
 * Opened from the header's storage summary. Data is mocked (phase-2 API) via
 * [useAssetStorage](/composables/useAssetStorage).
 */
const open = defineModel<boolean>('open', { default: false });

const { storage } = useAssetStorage();

// Segment share is of the used total (matches the prototype's percentages).
const usedPct = computed(() =>
  storage.value.totalBytes
    ? Math.round((storage.value.usedBytes / storage.value.totalBytes) * 100)
    : 0,
);
const segmentPct = (bytes: number) =>
  storage.value.usedBytes
    ? Math.round((bytes / storage.value.usedBytes) * 100)
    : 0;

const tab = ref<'type' | 'folder'>('type');
const segments = computed(() =>
  tab.value === 'folder' ? storage.value.byFolder : storage.value.byType,
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
                  $t('asset_library.storage.of_used', {
                    total: formatFileSize(storage.totalBytes),
                  })
                }}
              </span>
            </p>
          </div>
          <Progress :model-value="usedPct" />
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

        <div class="space-y-6">
          <div v-for="seg in segments" :key="seg.key" class="space-y-1.5">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{{ seg.label }}</span>
              <span class="text-muted-foreground tabular-nums">
                <span class="text-foreground">
                  {{ formatFileSize(seg.bytes) }}
                </span>
                · {{ segmentPct(seg.bytes) }}%
              </span>
            </div>
            <Progress
              :model-value="segmentPct(seg.bytes)"
              :indicator-class="seg.indicatorClass"
              class="h-1.5"
            />
          </div>
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
