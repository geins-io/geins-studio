<script setup lang="ts">
import type { SchemaField, StorefrontSettings } from '#shared/types';
import {
  getSettingValue,
  setSettingValue,
  groupFieldsIntoRows,
  gridClass,
} from '@/utils/storefront';

defineOptions({ name: 'ChannelSchemaField' });

const props = defineProps<{
  field: SchemaField;
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

</script>

<template>
  <!-- string -->
  <div v-if="field.type === 'string'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <Input
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      :placeholder="field.placeholder"
      :disabled="field.disabled"
      @update:model-value="updateValue(field.key, $event)"
    />
    <FormInputDescription v-if="field.description">
      {{ field.description }}
    </FormInputDescription>
  </div>

  <!-- number -->
  <div v-else-if="field.type === 'number'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <Input
      type="number"
      :model-value="(getSettingValue(modelValue, field.key) as number) ?? ''"
      :min="field.min"
      :max="field.max"
      :placeholder="field.placeholder"
      :disabled="field.disabled"
      @update:model-value="updateValue(field.key, Number($event))"
    />
    <FormInputDescription v-if="field.description">
      {{ field.description }}
    </FormInputDescription>
  </div>

  <!-- boolean -->
  <Item
    v-else-if="field.type === 'boolean'"
    variant="outline"
    class="rounded-lg p-3"
  >
    <ItemMedia v-if="field.icon" variant="icon">
      <component
        :is="resolveIcon(field.icon)"
        class="text-muted-foreground size-4"
      />
    </ItemMedia>
    <ItemContent>
      <ItemTitle>{{ field.label }}</ItemTitle>
      <ItemDescription v-if="field.description">
        {{ field.description }}
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Switch
        :model-value="
          (getSettingValue(modelValue, field.key) as boolean) ?? false
        "
        :disabled="field.disabled"
        @update:model-value="updateValue(field.key, $event)"
      />
    </ItemActions>
  </Item>

  <!-- select -->
  <div v-else-if="field.type === 'select'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <Select
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      @update:model-value="updateValue(field.key, $event)"
    >
      <SelectTrigger :disabled="field.disabled">
        <SelectValue :placeholder="field.placeholder || 'Select...'" />
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
    <FormInputDescription v-if="field.description">
      {{ field.description }}
    </FormInputDescription>
  </div>

  <!-- font -->
  <div v-else-if="field.type === 'font'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <ChannelSchemaFieldFont
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      @update:model-value="updateValue(field.key, $event)"
    />
    <FormInputDescription v-if="field.description">
      {{ field.description }}
    </FormInputDescription>
  </div>

  <!-- color -->
  <div v-else-if="field.type === 'color'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <ChannelSchemaFieldColor
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      :label="field.label"
      @update:model-value="updateValue(field.key, $event)"
    />
    <FormInputDescription v-if="field.description">
      {{ field.description }}
    </FormInputDescription>
  </div>

  <!-- image -->
  <div v-else-if="field.type === 'image'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <ChannelSchemaFieldImage
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      :disabled="field.disabled"
      @update:model-value="updateValue(field.key, $event)"
    />
    <FormInputDescription v-if="field.description">
      {{ field.description }}
    </FormInputDescription>
  </div>

  <!-- radio-cards -->
  <div v-else-if="field.type === 'radio-cards'" class="space-y-1.5">
    <Label>{{ field.label }}</Label>
    <ChannelSchemaFieldRadioCards
      :options="field.options ?? []"
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      @update:model-value="updateValue(field.key, $event)"
    />
  </div>

  <!-- radio -->
  <div v-else-if="field.type === 'radio'" class="space-y-1.5">
    <RadioGroup
      :model-value="(getSettingValue(modelValue, field.key) as string) ?? ''"
      @update:model-value="updateValue(field.key, $event)"
    >
      <div
        v-for="option in field.options"
        :key="option.value"
        class="flex items-center gap-3"
      >
        <RadioGroupItem
          :id="`${field.key}-${option.value}`"
          :value="option.value"
        />
        <Label :for="`${field.key}-${option.value}`" class="font-medium">
          {{ option.label }}
        </Label>
      </div>
    </RadioGroup>
  </div>

  <!-- sub-section -->
  <div v-else-if="field.type === 'sub-section'" class="space-y-3.5">
    <div class="pt-2">
      <ContentCardHeader
        :title="field.label"
        :description="field.description"
        size="md"
      />
    </div>
    <!-- With columns: lay out children directly in grid -->
    <div
      v-if="field.children && field.columns && field.columns > 1"
      :class="gridClass(field.columns, 'gap-8')"
    >
      <template v-for="child in field.children" :key="child.key">
        <ChannelSchemaField
          v-if="isVisible(child)"
          :field="child"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </template>
    </div>
    <!-- Without columns: group children into rows -->
    <div v-else-if="field.children" class="space-y-4">
      <template
        v-for="row in groupFieldsIntoRows(field.children)"
        :key="row.fields.map((f) => f.key).join('-')"
      >
        <div :class="row.columns > 1 ? gridClass(row.columns) : undefined">
          <template v-for="child in row.fields" :key="child.key">
            <ChannelSchemaField
              v-if="isVisible(child)"
              :field="child"
              :model-value="modelValue"
              @update:model-value="$emit('update:modelValue', $event)"
            />
          </template>
        </div>
      </template>
    </div>
  </div>

  <!-- group -->
  <ContentSwitch
    v-else-if="field.type === 'group'"
    :label="field.label"
    :description="field.description"
    :icon="field.icon"
    :checked="(getSettingValue(modelValue, field.key) as boolean) ?? false"
    @update:checked="updateValue(field.key, $event)"
  >
    <div v-if="field.children" class="space-y-4 border-t pt-4">
      <template v-for="child in field.children" :key="child.key">
        <ChannelSchemaField
          v-if="isVisible(child)"
          :field="child"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </template>
    </div>
  </ContentSwitch>
</template>
