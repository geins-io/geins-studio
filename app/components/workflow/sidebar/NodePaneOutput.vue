<script setup lang="ts">
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue'

type NodeExecution = {
  input?: Record<string, unknown> | null
  output?: Record<string, unknown> | null
  status?: string
} | null

const props = defineProps<{
  nodeExecution?: NodeExecution
}>()

const hasExecutionOutput = computed(() => props.nodeExecution?.output != null)

const formatJson = (value: unknown): string => {
  if (value == null) return '{}'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}
</script>

<template>
  <div class="flex w-1/4 min-w-0 flex-col border-l">
    <div class="flex items-center gap-1.5 border-b px-3 py-2">
      <LucideArrowUpFromLine class="text-muted-foreground h-3.5 w-3.5" />
      <span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Output</span>
      <span
        v-if="hasExecutionOutput"
        class="ml-auto h-1.5 w-1.5 rounded-full bg-green-500"
      />
    </div>
    <div class="flex-1 overflow-y-auto p-3" style="scrollbar-gutter: stable;">
      <!-- Execution output data -->
      <template v-if="hasExecutionOutput">
        <h4 class="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">Run data</h4>
        <div class="min-h-40 flex-1">
          <JsonCodeEditor
            :model-value="formatJson(nodeExecution?.output)"
            :readonly="true"
            :line-numbers="false"
            :line-wrapping="true"
            :expandable="true"
          />
        </div>
      </template>
      <div
        v-else
        class="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8 text-center text-xs"
      >
        <LucideInbox class="h-8 w-8 opacity-40" />
        <div>
          <p class="font-medium">No output data</p>
          <p class="mt-0.5 opacity-70">Run the workflow to view output data</p>
        </div>
      </div>
    </div>
  </div>
</template>
