<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | File | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: File | null];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref<string | null>(null);
const localPreviewUrl = ref<string | null>(null);

const previewUrl = computed(() => {
  if (localPreviewUrl.value) return localPreviewUrl.value;
  if (typeof props.modelValue === 'string' && props.modelValue)
    return props.modelValue;
  return null;
});

const { t } = useI18n();

const hasImage = computed(() => !!previewUrl.value);

const displayName = computed(() => {
  if (selectedFileName.value) return selectedFileName.value;
  if (typeof props.modelValue === 'string' && props.modelValue) {
    const filename = props.modelValue.substring(
      props.modelValue.lastIndexOf('/') + 1,
    );
    // Strip the "storefrontSettings." prefix the server adds
    return filename.replace(/^storefrontSettings\./, '');
  }
  return null;
});

function openFilePicker() {
  if (!props.disabled) fileInputRef.value?.click();
}

function handleFile(file: File | null) {
  if (file) {
    if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value);
    selectedFileName.value = file.name;
    localPreviewUrl.value = URL.createObjectURL(file);
  } else {
    selectedFileName.value = null;
    localPreviewUrl.value = null;
  }
  emit('update:modelValue', file);
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  handleFile(target.files?.[0] ?? null);
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  if (props.disabled) return;
  const file = event.dataTransfer?.files?.[0];
  if (file?.type.startsWith('image/')) handleFile(file);
}

function onDragOver() {
  if (!props.disabled) isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

const isDragging = ref(false);

onBeforeUnmount(() => {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value);
});
</script>

<template>
  <Item
    variant="outline"
    class="cursor-pointer transition-colors"
    :class="[
      isDragging && 'border-muted-foreground/50 bg-primary/3',
      !disabled && 'hover:border-muted-foreground/50',
    ]"
    role="button"
    :tabindex="disabled ? -1 : 0"
    @click="openFilePicker"
    @keydown.enter="openFilePicker"
    @drop.prevent="onDrop"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
  >
    <!-- Uploaded state -->
    <template v-if="hasImage">
      <ItemMedia variant="image" class="size-12 border">
        <img :src="previewUrl!" alt="logotype" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{{ displayName }}</ItemTitle>
        <ItemDescription>{{ t('image_upload_replace') }}</ItemDescription>
      </ItemContent>
    </template>

    <!-- Empty state -->
    <template v-else>
      <ItemMedia variant="icon" class="size-12 border border-dashed">
        <LucideImagePlus class="text-muted-foreground size-6" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle class="">{{ t('image_upload_empty') }}</ItemTitle>
        <ItemDescription>{{
          t('image_upload_empty_max_size', { size: '100MB' })
        }}</ItemDescription>
      </ItemContent>
    </template>
  </Item>

  <input
    ref="fileInputRef"
    type="file"
    accept="image/*"
    :disabled="disabled"
    class="sr-only"
    tabindex="-1"
    @change="onFileChange"
  />
</template>
