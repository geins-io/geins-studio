<script setup lang="ts">
import { type Component } from 'vue'

export interface ViewMode {
  key: string
  label: string
  icon?: Component
}

const props = defineProps<{
  modes: ViewMode[]
}>()

const modelValue = defineModel<string>({ required: true })

const setMode = (key: string) => {
  modelValue.value = key
}
</script>

<template>
  <div class="bg-muted inline-flex items-center gap-1 rounded-lg p-1">
    <button
      v-for="mode in props.modes"
      :key="mode.key"
      type="button"
      :class="
        cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          modelValue === mode.key
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )
      "
      @click="setMode(mode.key)"
    >
      <component
        :is="mode.icon"
        v-if="mode.icon"
        class="size-3.5"
      />
      {{ mode.label }}
    </button>
  </div>
</template>
