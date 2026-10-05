<script setup lang="ts">
/**
 * Loading placeholder shaped like `AssetCard` so the grid doesn't jump when
 * cards replace it. Row heights match the card's line boxes (name `text-sm`,
 * `sm` badge, `text-xs` footer); folder/tag rows are omitted as the common case.
 */
</script>

<template>
  <Card class="flex h-full flex-col gap-0 overflow-hidden py-0">
    <Skeleton class="aspect-[3/2] w-full rounded-none" />
    <div class="flex flex-1 flex-col gap-2 p-3">
      <div class="flex h-5 items-center">
        <Skeleton class="h-3.5 w-3/4 rounded-sm" />
      </div>
      <Skeleton class="h-5 w-14 rounded-full" />
      <div class="mt-auto flex h-4 items-center justify-between">
        <Skeleton class="h-3 w-12 rounded-sm" />
        <Skeleton class="h-3 w-16 rounded-sm" />
      </div>
    </div>
  </Card>
</template>
