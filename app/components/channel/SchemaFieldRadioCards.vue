<script setup lang="ts">
import type { SchemaFieldOption } from '#shared/types';

const props = defineProps<{
  options: SchemaFieldOption[];
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<template>
  <div class="grid grid-cols-2 gap-6">
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      :class="[
        'flex flex-col gap-2 rounded-lg border p-5 text-left transition-colors',
        modelValue === option.value
          ? 'border-positive bg-primary/3'
          : 'border-border hover:border-muted-foreground/50',
      ]"
      @click="emit('update:modelValue', option.value)"
    >
      <ContentCardHeader
        :title="option.label"
        :description="option.description"
        :icon="option.type === 'color' ? undefined : option.icon"
        size="sm"
      >
        <template v-if="option.type === 'color'" #icon>
          <div
            class="size-7.5 rounded border"
            :style="{ backgroundColor: option.value }"
          />
        </template>
      </ContentCardHeader>
    </button>
  </div>
</template>
