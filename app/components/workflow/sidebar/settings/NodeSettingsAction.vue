<script setup lang="ts">
import type { ManifestActionOutput } from '#shared/types'
import type { ManifestAction } from '@/composables/useWorkflowManifest'
import NodeSettingsHttpRequest from './NodeSettingsHttpRequest.vue'
import type { Component } from 'vue'

const ACTION_SETTINGS_COMPONENTS: Record<string, Component> = {
  'net.httpRequest': NodeSettingsHttpRequest,
}

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeInput: Record<string, unknown>
  manifestAction?: ManifestAction
  updateInput: (name: string, value: unknown) => void
}>()

const customComponent = computed(() => {
  const name = props.nodeData.actionName as string | undefined
  return name ? ACTION_SETTINGS_COMPONENTS[name] : undefined
})

const actionInputFields = computed(() => props.manifestAction?.input ?? [])
const actionOutputFields = computed<ManifestActionOutput[]>(() => props.manifestAction?.output ?? [])

const prettyLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

const inputTypeToHtml = (type: string): string => {
  const lower = type.toLowerCase()
  if (lower === 'number' || lower === 'integer' || lower === 'int') return 'number'
  if (lower === 'boolean' || lower === 'bool') return 'checkbox'
  return 'text'
}

const isTextarea = (field: { editorHint?: string, type: string }): boolean =>
  field.editorHint === 'textarea'
  || field.editorHint === 'json'
  || field.editorHint === 'expression'
  || field.type.toLowerCase() === 'object'
  || field.type.toLowerCase() === 'json'

const isSelect = (field: { allowedValues?: unknown[] }): boolean =>
  Array.isArray(field.allowedValues) && field.allowedValues.length > 0
</script>

<template>
  <div>
    <div v-if="nodeData.actionName" class="mb-4 space-y-2">
      <label class="text-sm font-medium">Action</label>
      <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 font-mono text-xs">
        {{ nodeData.actionName }}
      </div>
    </div>

    <!-- Action-specific settings component -->
    <component
      :is="customComponent"
      v-if="customComponent"
      :node-data="nodeData"
      :node-input="nodeInput"
      :manifest-action="manifestAction"
      :update-input="updateInput"
    />

    <!-- Generic manifest-driven form (fallback) -->
    <div v-else-if="actionInputFields.length" class="space-y-3">
      <div v-for="field in actionInputFields" :key="field.name" class="space-y-1">
        <label class="text-muted-foreground flex items-center gap-1 text-sm">
          {{ prettyLabel(field.name) }}
          <span v-if="field.required" class="text-destructive">*</span>
        </label>
        <p v-if="field.description" class="text-muted-foreground text-xs">
          {{ field.description }}
        </p>
        <select
          v-if="isSelect(field)"
          :value="nodeInput[field.name] ?? field.default ?? ''"
          class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          @change="updateInput(field.name, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">
            Select…
          </option>
          <option
            v-for="opt in field.allowedValues"
            :key="String(opt)"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
        <textarea
          v-else-if="isTextarea(field)"
          :value="typeof nodeInput[field.name] === 'object' ? JSON.stringify(nodeInput[field.name], null, 2) : String(nodeInput[field.name] ?? field.default ?? '')"
          rows="3"
          :placeholder="field.editorHint === 'expression' ? '{{ expression }}' : ''"
          class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
          @input="updateInput(field.name, ($event.target as HTMLTextAreaElement).value)"
        />
        <div
          v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
          class="flex items-center gap-2"
        >
          <input
            type="checkbox"
            :checked="Boolean(nodeInput[field.name] ?? field.default)"
            class="rounded border"
            @change="updateInput(field.name, ($event.target as HTMLInputElement).checked)"
          />
        </div>
        <input
          v-else
          :type="inputTypeToHtml(field.type)"
          :value="nodeInput[field.name] ?? field.default ?? ''"
          :placeholder="String(field.default ?? '')"
          class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          @input="updateInput(field.name, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Output schema -->
    <div v-if="actionOutputFields.length" class="mt-4 border-t pt-4">
      <h4 class="mb-3 text-sm font-medium">Output Schema</h4>
      <div class="space-y-1">
        <div
          v-for="field in actionOutputFields"
          :key="field.name"
          class="flex items-center justify-between rounded px-2 py-1.5 text-xs"
        >
          <span class="font-mono font-medium">{{ field.name }}</span>
          <span class="text-muted-foreground font-mono">{{ field.type }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
