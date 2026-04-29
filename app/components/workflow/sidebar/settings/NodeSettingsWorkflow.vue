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
      <label class="text-sm font-medium">Workflow ID</label>
      <input
        :value="nodeConfig.workflowId ?? ''"
        placeholder="Workflow ID to execute"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('workflowId', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="space-y-1">
      <label class="text-sm font-medium">Workflow name</label>
      <input
        :value="nodeConfig.workflowName ?? ''"
        placeholder="Display name (optional)"
        class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        @input="updateConfig('workflowName', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        :checked="Boolean(nodeConfig.waitForCompletion ?? true)"
        class="rounded border"
        @change="updateConfig('waitForCompletion', ($event.target as HTMLInputElement).checked)"
      />
      <label class="text-sm">Wait for completion</label>
    </div>

    <p class="text-muted-foreground text-xs">
      Executes another workflow as a sub-workflow. Input data is passed through automatically.
    </p>
  </div>
</template>
