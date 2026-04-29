<script setup lang="ts">
import type { SchemaTab, StorefrontSettings } from '#shared/types';
import { groupFieldsIntoRows, gridClass } from '@/utils/storefront';

defineProps<{
  schema: SchemaTab;
  modelValue: StorefrontSettings;
}>();

defineEmits<{
  'update:modelValue': [value: StorefrontSettings];
}>();
</script>

<template>
  <div class="space-y-6">
    <ContentSection
      v-for="section in schema.sections"
      :key="section.key"
      :title="section.title"
      :description="section.description"
      :icon="section.icon"
    >
      <template
        v-for="row in groupFieldsIntoRows(section.fields)"
        :key="row.fields.map((f) => f.key).join('-')"
      >
        <div
          :class="
            row.columns > 1 ? gridClass(row.columns) : undefined
          "
        >
          <template v-for="field in row.fields" :key="field.key">
            <ChannelSchemaField
              :field="field"
              :model-value="modelValue"
              :is-first-sub-section="
                field.key ===
                section.fields.find((f) => f.type === 'sub-section')?.key
              "
              @update:model-value="$emit('update:modelValue', $event)"
            />
          </template>
        </div>
      </template>
    </ContentSection>
  </div>
</template>
