<script setup lang="ts">
defineProps<{
  nodeData: Record<string, unknown>
}>()
</script>

<template>
  <div class="space-y-3 text-sm">
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground">Trigger type</span>
      <span class="font-medium capitalize">{{ nodeData.triggerType || 'onDemand' }}</span>
    </div>
    <div v-if="nodeData.cronExpression" class="flex items-center justify-between gap-2">
      <span class="text-muted-foreground">Cron</span>
      <span class="font-mono text-xs">{{ nodeData.cronExpression }}</span>
    </div>
    <div
      v-if="nodeData.eventEntity || nodeData.eventName"
      class="flex items-center justify-between gap-2"
    >
      <span class="text-muted-foreground">Event</span>
      <span class="font-medium">
        {{ nodeData.eventEntity || nodeData.eventName }}{{ nodeData.eventAction ? ` / ${nodeData.eventAction}` : '' }}
      </span>
    </div>
    <p class="text-muted-foreground border-t pt-3 text-xs">
      Trigger configuration is managed in the General tab.
    </p>
  </div>
</template>
