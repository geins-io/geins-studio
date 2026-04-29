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
      <label class="text-sm font-medium">Items field</label>
      <input
        :value="nodeConfig.itemsField ?? nodeConfig.collection ?? ''"
        placeholder="e.g. {{ order.items }}"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('itemsField', ($event.target as HTMLInputElement).value)"
      />
      <p class="text-muted-foreground text-xs">Expression that returns the array to iterate over</p>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Batch size</label>
      <input
        type="number"
        :value="nodeConfig.batchSize ?? ''"
        placeholder="Process all at once"
        min="1"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('batchSize', Number(($event.target as HTMLInputElement).value) || undefined)"
      />
      <p class="text-muted-foreground text-xs">Number of items to process per batch (leave empty for all)</p>
    </div>

    <div class="text-muted-foreground border-t pt-3 text-xs">
      <p><span class="font-medium text-purple-600">Each</span> runs once per item (or batch)</p>
      <p class="mt-1"><span class="font-medium text-gray-500">Done</span> runs after all items are processed</p>
    </div>
  </div>
</template>
