<script setup lang="ts">
import type { SchemaFieldOption } from '#shared/types';

const props = defineProps<{
  options: SchemaFieldOption[];
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function resolveIcon(iconName?: string) {
  if (!iconName) return null;
  return resolveComponent(`Lucide${iconName}`);
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      :class="[
        'flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors',
        modelValue === option.value
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/50',
      ]"
      @click="emit('update:modelValue', option.value)"
    >
      <div class="flex items-center gap-2">
        <component
          :is="resolveIcon(option.icon)"
          v-if="option.icon"
          class="text-muted-foreground size-4"
        />
        <span class="text-sm font-medium">{{ option.label }}</span>
      </div>
      <p v-if="option.description" class="text-muted-foreground text-xs">
        {{ option.description }}
      </p>
    </button>
  </div>
</template>
