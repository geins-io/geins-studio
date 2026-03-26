<script setup lang="ts">
import type { SchemaTab, SchemaField, StorefrontSettings } from '#shared/types';
import { getSettingValue, setSettingValue } from '@/utils/storefront';

const props = defineProps<{
  schema: SchemaTab;
  modelValue: StorefrontSettings;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: StorefrontSettings];
}>();

const { resolveIcon } = useLucideIcon();

function updateValue(key: string, value: unknown) {
  emit('update:modelValue', setSettingValue(props.modelValue, key, value));
}

function isVisible(field: SchemaField): boolean {
  if (!field.visibleWhen) return true;
  return (
    getSettingValue(props.modelValue, field.visibleWhen.field) ===
    field.visibleWhen.equals
  );
}

/**
 * Groups consecutive fields with the same `columns` value into layout rows.
 * Fields without `columns` (or columns: 1) are placed in their own row.
 */
function groupFieldsIntoRows(
  fields: SchemaField[],
): { columns: number; fields: SchemaField[] }[] {
  const rows: { columns: number; fields: SchemaField[] }[] = [];

  for (const field of fields) {
    const cols = field.columns ?? 1;
    const lastRow = rows[rows.length - 1];

    if (lastRow && lastRow.columns === cols && cols > 1) {
      lastRow.fields.push(field);
    } else {
      rows.push({ columns: cols, fields: [field] });
    }
  }

  return rows;
}

function onFileChange(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  updateValue(key, file ? file.name : null);
}
</script>

<template>
  <div class="space-y-6">
    <ContentEditCard
      v-for="section in schema.sections"
      :key="section.key"
      :title="section.title"
      :description="section.description"
    >
      <div class="space-y-4">
        <template
          v-for="row in groupFieldsIntoRows(section.fields)"
          :key="row.fields.map((f) => f.key).join('-')"
        >
          <div
            :class="
              row.columns > 1
                ? `grid grid-cols-${row.columns} gap-4`
                : undefined
            "
          >
            <template v-for="field in row.fields" :key="field.key">
              <div v-if="isVisible(field)">
                <!-- string -->
                <div v-if="field.type === 'string'" class="space-y-2">
                  <Label>{{ field.label }}</Label>
                  <Input
                    :model-value="
                      (getSettingValue(modelValue, field.key) as string) ?? ''
                    "
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    @update:model-value="updateValue(field.key, $event)"
                  />
                  <p
                    v-if="field.description"
                    class="text-muted-foreground text-xs"
                  >
                    {{ field.description }}
                  </p>
                </div>

                <!-- number -->
                <div v-else-if="field.type === 'number'" class="space-y-2">
                  <Label>{{ field.label }}</Label>
                  <Input
                    type="number"
                    :model-value="
                      (getSettingValue(modelValue, field.key) as number) ?? ''
                    "
                    :min="field.min"
                    :max="field.max"
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    @update:model-value="updateValue(field.key, Number($event))"
                  />
                  <p
                    v-if="field.description"
                    class="text-muted-foreground text-xs"
                  >
                    {{ field.description }}
                  </p>
                </div>

                <!-- boolean -->
                <div
                  v-else-if="field.type === 'boolean'"
                  class="flex items-center justify-between rounded-lg border p-3"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="resolveIcon(field.icon)"
                      v-if="field.icon"
                      class="text-muted-foreground size-4"
                    />
                    <div>
                      <p class="text-sm font-medium">{{ field.label }}</p>
                      <p
                        v-if="field.description"
                        class="text-muted-foreground text-xs"
                      >
                        {{ field.description }}
                      </p>
                    </div>
                  </div>
                  <Switch
                    :model-value="
                      (getSettingValue(modelValue, field.key) as boolean) ??
                      false
                    "
                    :disabled="field.disabled"
                    @update:model-value="updateValue(field.key, $event)"
                  />
                </div>

                <!-- select -->
                <div v-else-if="field.type === 'select'" class="space-y-2">
                  <Label>{{ field.label }}</Label>
                  <Select
                    :model-value="
                      (getSettingValue(modelValue, field.key) as string) ?? ''
                    "
                    @update:model-value="updateValue(field.key, $event)"
                  >
                    <SelectTrigger :disabled="field.disabled">
                      <SelectValue
                        :placeholder="field.placeholder || 'Select...'"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in field.options"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p
                    v-if="field.description"
                    class="text-muted-foreground text-xs"
                  >
                    {{ field.description }}
                  </p>
                </div>

                <!-- color -->
                <div v-else-if="field.type === 'color'" class="space-y-2">
                  <Label>{{ field.label }}</Label>
                  <ChannelSchemaFieldColor
                    :model-value="
                      (getSettingValue(modelValue, field.key) as string) ?? ''
                    "
                    :label="field.label"
                    @update:model-value="updateValue(field.key, $event)"
                  />
                </div>

                <!-- file -->
                <div v-else-if="field.type === 'file'" class="space-y-2">
                  <Label>{{ field.label }}</Label>
                  <Input
                    type="file"
                    :accept="field.accept"
                    :disabled="field.disabled"
                    @change="onFileChange(field.key, $event)"
                  />
                  <p
                    v-if="field.description"
                    class="text-muted-foreground text-xs"
                  >
                    {{ field.description }}
                  </p>
                </div>

                <!-- radio-cards -->
                <div v-else-if="field.type === 'radio-cards'" class="space-y-2">
                  <Label>{{ field.label }}</Label>
                  <ChannelSchemaFieldRadioCards
                    :options="field.options ?? []"
                    :model-value="
                      (getSettingValue(modelValue, field.key) as string) ?? ''
                    "
                    @update:model-value="updateValue(field.key, $event)"
                  />
                </div>

                <!-- group -->
                <div
                  v-else-if="field.type === 'group'"
                  class="rounded-lg border"
                >
                  <div class="flex items-center justify-between gap-4 p-4">
                    <div class="flex items-center gap-3">
                      <component
                        :is="resolveIcon(field.icon)"
                        v-if="field.icon"
                        class="text-muted-foreground size-4"
                      />
                      <div>
                        <p class="text-sm font-medium">{{ field.label }}</p>
                        <p
                          v-if="field.description"
                          class="text-muted-foreground text-xs"
                        >
                          {{ field.description }}
                        </p>
                      </div>
                    </div>
                    <Switch
                      :model-value="
                        (getSettingValue(modelValue, field.key) as boolean) ??
                        false
                      "
                      @update:model-value="updateValue(field.key, $event)"
                    />
                  </div>
                  <div
                    v-if="
                      field.children &&
                      (getSettingValue(modelValue, field.key) as boolean)
                    "
                    class="border-t p-4"
                  >
                    <div class="space-y-4">
                      <template
                        v-for="child in field.children"
                        :key="child.key"
                      >
                        <div v-if="isVisible(child)">
                          <!-- Recursive field rendering for group children -->
                          <!-- boolean child -->
                          <div
                            v-if="child.type === 'boolean'"
                            class="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div class="flex items-center gap-3">
                              <component
                                :is="resolveIcon(child.icon)"
                                v-if="child.icon"
                                class="text-muted-foreground size-4"
                              />
                              <div>
                                <p class="text-sm font-medium">
                                  {{ child.label }}
                                </p>
                                <p
                                  v-if="child.description"
                                  class="text-muted-foreground text-xs"
                                >
                                  {{ child.description }}
                                </p>
                              </div>
                            </div>
                            <Switch
                              :model-value="
                                (getSettingValue(
                                  modelValue,
                                  child.key,
                                ) as boolean) ?? false
                              "
                              :disabled="child.disabled"
                              @update:model-value="
                                updateValue(child.key, $event)
                              "
                            />
                          </div>
                          <!-- string child -->
                          <div
                            v-else-if="child.type === 'string'"
                            class="space-y-2"
                          >
                            <Label>{{ child.label }}</Label>
                            <Input
                              :model-value="
                                (getSettingValue(
                                  modelValue,
                                  child.key,
                                ) as string) ?? ''
                              "
                              :placeholder="child.placeholder"
                              :disabled="child.disabled"
                              @update:model-value="
                                updateValue(child.key, $event)
                              "
                            />
                          </div>
                          <!-- select child -->
                          <div
                            v-else-if="child.type === 'select'"
                            class="space-y-2"
                          >
                            <Label>{{ child.label }}</Label>
                            <Select
                              :model-value="
                                (getSettingValue(
                                  modelValue,
                                  child.key,
                                ) as string) ?? ''
                              "
                              @update:model-value="
                                updateValue(child.key, $event)
                              "
                            >
                              <SelectTrigger :disabled="child.disabled">
                                <SelectValue
                                  :placeholder="
                                    child.placeholder || 'Select...'
                                  "
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  v-for="option in child.options"
                                  :key="option.value"
                                  :value="option.value"
                                >
                                  {{ option.label }}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <!-- color child -->
                          <div
                            v-else-if="child.type === 'color'"
                            class="space-y-2"
                          >
                            <Label>{{ child.label }}</Label>
                            <ChannelSchemaFieldColor
                              :model-value="
                                (getSettingValue(
                                  modelValue,
                                  child.key,
                                ) as string) ?? ''
                              "
                              :label="child.label"
                              @update:model-value="
                                updateValue(child.key, $event)
                              "
                            />
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </ContentEditCard>
  </div>
</template>
