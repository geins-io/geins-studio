<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | File | null;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
  description?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: File | null];
}>();

const { t } = useI18n();

const acceptAttr = computed(() => props.accept ?? 'image/*');
const maxBytes = computed(() =>
  props.maxSizeMB ? props.maxSizeMB * 1024 * 1024 : undefined,
);

const errorMessage = ref<string | null>(null);

function fileMatchesAccept(file: File): boolean {
  const accept = acceptAttr.value;
  if (!accept || accept === '*') return true;
  const tokens = accept.split(',').map((s) => s.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (!token) return false;
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

function validateFile(file: File): boolean {
  if (!fileMatchesAccept(file)) {
    errorMessage.value = t('image_upload_invalid_type', {
      accept: acceptAttr.value,
    });
    return false;
  }
  if (maxBytes.value !== undefined && file.size > maxBytes.value) {
    errorMessage.value = t('image_upload_too_large', {
      size: `${props.maxSizeMB} MB`,
    });
    return false;
  }
  errorMessage.value = null;
  return true;
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref<string | null>(null);
const localPreviewUrl = ref<string | null>(null);

const previewUrl = computed(() => {
  if (localPreviewUrl.value) return localPreviewUrl.value;
  if (typeof props.modelValue === 'string' && props.modelValue)
    return props.modelValue;
  return null;
});

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
    if (!validateFile(file)) return;
    if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value);
    selectedFileName.value = file.name;
    localPreviewUrl.value = URL.createObjectURL(file);
  } else {
    selectedFileName.value = null;
    localPreviewUrl.value = null;
    errorMessage.value = null;
  }
  emit('update:modelValue', file);
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  handleFile(target.files?.[0] ?? null);
  // Reset so picking the same file twice still fires `change`
  target.value = '';
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  if (props.disabled) return;
  const file = event.dataTransfer?.files?.[0];
  if (file) handleFile(file);
}

function onDragOver() {
  if (!props.disabled) isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

const { handleImageError } = useGeinsImage();

const isDragging = ref(false);

function onImageError(event: Event) {
  if (localPreviewUrl.value) {
    URL.revokeObjectURL(localPreviewUrl.value);
    localPreviewUrl.value = null;
    selectedFileName.value = null;
  }
  handleImageError(event);
}

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
      !disabled && !errorMessage && 'hover:border-muted-foreground/50',
      errorMessage && 'border-destructive',
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
        <img :src="previewUrl!" alt="logotype" @error="onImageError" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle class="break-all">{{ displayName }}</ItemTitle>
        <ItemDescription :class="errorMessage && 'text-destructive'">
          {{ errorMessage ?? t('image_upload_replace') }}
        </ItemDescription>
      </ItemContent>
    </template>

    <!-- Empty state -->
    <template v-else>
      <ItemMedia variant="icon" class="size-12 border border-dashed">
        <LucideImagePlus class="text-muted-foreground size-6" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle class="">{{ t('image_upload_empty') }}</ItemTitle>
        <ItemDescription
          v-if="errorMessage || description"
          :class="errorMessage && 'text-destructive'"
        >
          {{ errorMessage ?? description }}
        </ItemDescription>
      </ItemContent>
    </template>
  </Item>

  <input
    ref="fileInputRef"
    type="file"
    :accept="acceptAttr"
    :disabled="disabled"
    class="sr-only"
    tabindex="-1"
    @change="onFileChange"
  />
</template>
