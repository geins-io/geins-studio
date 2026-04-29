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
      <label class="text-sm font-medium">Field</label>
      <input
        :value="nodeConfig.field ?? ''"
        placeholder="e.g. order.status"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('field', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Operator</label>
      <select
        :value="nodeConfig.operator ?? 'equals'"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @change="updateConfig('operator', ($event.target as HTMLSelectElement).value)"
      >
        <option value="equals">Equals</option>
        <option value="notEquals">Not Equals</option>
        <option value="contains">Contains</option>
        <option value="greaterThan">Greater Than</option>
        <option value="lessThan">Less Than</option>
        <option value="exists">Exists</option>
        <option value="notExists">Not Exists</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Value</label>
      <input
        :value="nodeConfig.value ?? ''"
        placeholder="Value to compare"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('value', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="text-muted-foreground border-t pt-3 text-xs">
      <p><span class="font-medium text-green-600">Yes</span> branch runs when condition is true</p>
      <p class="mt-1"><span class="font-medium text-red-600">No</span> branch runs when condition is false</p>
    </div>
  </div>
</template>
