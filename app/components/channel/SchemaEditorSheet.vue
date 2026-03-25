<script setup lang="ts">
import type { StorefrontSchema } from '#shared/types';
import defaultSchemaJson from '@/assets/schemas/storefront-settings-default.json';

const props = defineProps<{
  open: boolean;
  schema: StorefrontSchema;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  apply: [schema: StorefrontSchema];
  reset: [];
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

function handleReset() {
  editorContent.value = JSON.stringify(defaultSchemaJson, null, 2);
  emit('reset');
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
        <textarea
          v-model="editorContent"
          class="bg-muted text-foreground border-input flex-1 resize-none rounded-lg border p-3 font-mono text-sm focus:outline-none"
          spellcheck="false"
        />
        <p v-if="jsonError" class="text-destructive text-sm">
          {{ jsonError }}
        </p>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="handleReset">
          {{ t('channels.schema_editor_reset') }}
        </Button>
        <Button :disabled="!!jsonError" @click="handleApply">
          {{ t('channels.schema_editor_apply') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
