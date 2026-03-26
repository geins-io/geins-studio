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
    <ContentCard v-for="section in schema.sections" :key="section.key">
      <div class="space-y-4">
        <ContentCardHeader
          :title="section.title"
          :description="section.description"
          :icon="section.icon"
          size="md"
        />
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
                @update:model-value="$emit('update:modelValue', $event)"
              />
            </template>
          </div>
        </template>
      </div>
    </ContentCard>
  </div>
</template>
