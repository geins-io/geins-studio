<script setup lang="ts">
const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeConfig: Record<string, unknown>
  updateConfig: (name: string, value: unknown) => void
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <label class="text-sm font-medium">Page size</label>
      <input
        type="number"
        :value="nodeConfig.pageSize ?? ''"
        placeholder="e.g. 50"
        min="1"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('pageSize', Number(($event.target as HTMLInputElement).value) || undefined)"
      />
      <p class="text-muted-foreground text-xs">Number of items per page</p>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Max pages</label>
      <input
        type="number"
        :value="nodeConfig.maxPages ?? ''"
        placeholder="No limit"
        min="1"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('maxPages', Number(($event.target as HTMLInputElement).value) || undefined)"
      />
      <p class="text-muted-foreground text-xs">Maximum number of pages to fetch (leave empty for all)</p>
    </div>

    <div class="text-muted-foreground border-t pt-3 text-xs">
      <p><span class="font-medium text-indigo-600">Page</span> runs once per fetched page</p>
      <p class="mt-1"><span class="font-medium text-gray-500">Done</span> runs after all pages are processed</p>
    </div>
  </div>
</template>
