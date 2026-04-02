<script setup lang="ts">
import type { StorefrontSchema } from '#shared/types';
const props = defineProps<{
  open: boolean;
  schema: StorefrontSchema;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  apply: [schema: StorefrontSchema];
}>();

const { t } = useI18n();

const editorContent = ref('');

// Initialize editor content when sheet opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      editorContent.value = JSON.stringify(props.schema, null, 2);
    }
  },
);

// Live JSON validation
const jsonError = computed<string | null>(() => {
  try {
    const parsed = JSON.parse(editorContent.value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return t('channels.schema_editor_invalid_schema');
    }
    if (Object.keys(parsed).length === 0) {
      return t('channels.schema_editor_invalid_schema');
    }
    return null;
  } catch {
    return t('channels.schema_editor_invalid_json');
  }
});

function handleApply() {
  if (jsonError.value) return;
  const parsed = JSON.parse(editorContent.value) as StorefrontSchema;
  emit('apply', parsed);
  emit('update:open', false);
}
</script>

<template>
  <Sheet :open="props.open" @update:open="emit('update:open', $event)">
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>{{ t('channels.schema_editor_title') }}</SheetTitle>
        <SheetDescription>
          {{ t('channels.schema_editor_description') }}
        </SheetDescription>
      </SheetHeader>
      <SheetBody class="flex flex-1 flex-col gap-4 overflow-hidden">
        <Feedback type="warning">
          <template #title>{{
            t('channels.schema_editor_warning_title')
          }}</template>
          <template #description>{{
            t('channels.schema_editor_warning_description')
          }}</template>
        </Feedback>
        <LazyChannelJsonCodeEditor
          v-model="editorContent"
          class="min-h-0 flex-1"
        />
        <Feedback v-if="jsonError" type="negative">
          <template #title>{{ jsonError }}</template>
          <template #description>{{
            t('channels.schema_editor_invalid_schema')
          }}</template>
        </Feedback>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!!jsonError" @click="handleApply">
          {{ t('channels.schema_editor_apply') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
