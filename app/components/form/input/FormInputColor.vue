<script setup lang="ts">
import { LucideTriangleAlert } from '#components';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label: string;
    contrastWarning?: number | null;
  }>(),
  {
    contrastWarning: null,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const colorInputRef = ref<HTMLInputElement | null>(null);

const displayValue = computed(() => props.modelValue || '#000000');

function openPicker() {
  colorInputRef.value?.click();
}

function onPickerChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function onTextInput(value: string | number) {
  emit('update:modelValue', String(value));
}
</script>

<template>
  <InputGroup>
    <InputGroupAddon align="inline-start" class="ml-0!">
      <button
        type="button"
        class="size-5 shrink-0 cursor-pointer rounded-md border"
        :style="{ backgroundColor: displayValue }"
        :aria-label="`Pick ${label} color`"
        @click="openPicker"
      />
      <input
        ref="colorInputRef"
        type="color"
        :value="displayValue"
        class="sr-only"
        tabindex="-1"
        @input="onPickerChange"
      />
    </InputGroupAddon>

    <InputGroupInput
      :model-value="props.modelValue ?? ''"
      placeholder="#000000"
      @update:model-value="onTextInput"
    />

    <InputGroupAddon v-if="contrastWarning !== null" align="inline-end">
      <TooltipProvider :delay-duration="150">
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="flex shrink-0 cursor-help items-center">
              <LucideTriangleAlert class="text-warning size-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent class="max-w-xs">
            <p class="font-semibold">
              {{ t('theme_colors.contrast_warning_title') }}
            </p>
            <p>
              {{
                t('theme_colors.contrast_warning_body', {
                  ratio: contrastWarning,
                })
              }}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </InputGroupAddon>
  </InputGroup>
</template>
