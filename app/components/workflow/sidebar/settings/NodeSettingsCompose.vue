<script setup lang="ts">
import KeyValueEditor from '@/components/workflow/shared/KeyValueEditor.vue';

defineProps<{
  nodeData: Record<string, unknown>;
  nodeInput: Record<string, unknown>;
  editorHints: Record<string, unknown>;
  updateInput: (name: string, value: unknown) => void;
  updateEditorHint: (name: string, value: unknown) => void;
}>();
</script>

<template>
  <KeyValueEditor
    :input="nodeInput"
    :update-input="updateInput"
    :editor-hints="editorHints"
    :update-editor-hint="updateEditorHint"
    :label="$t('node.settings.compose.fields')"
    :description="$t('node.settings.compose.fields_help')"
    :key-placeholder="$t('node.settings.compose.field_name')"
    :value-placeholder="$t('node.settings.compose.value_placeholder')"
    :expand-title="$t('node.settings.compose.expand_title')"
  />
</template>
