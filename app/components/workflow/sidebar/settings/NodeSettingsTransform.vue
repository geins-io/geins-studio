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
    :label="$t('node.settings.transform.mapping')"
    :key-placeholder="$t('node.settings.transform.output_field_name')"
    value-placeholder="{{output.node-id.field}}"
    :expand-title="$t('node.settings.transform.expand_title')"
  />
</template>
