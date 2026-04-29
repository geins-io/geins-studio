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
      <label class="text-sm font-medium">Duration</label>
      <input
        type="number"
        :value="nodeConfig.duration ?? ''"
        placeholder="e.g. 30"
        min="1"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('duration', Number(($event.target as HTMLInputElement).value) || undefined)"
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Unit</label>
      <select
        :value="nodeConfig.unit ?? 'seconds'"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @change="updateConfig('unit', ($event.target as HTMLSelectElement).value)"
      >
        <option value="seconds">Seconds</option>
        <option value="minutes">Minutes</option>
        <option value="hours">Hours</option>
        <option value="days">Days</option>
      </select>
    </div>
  </div>
</template>
