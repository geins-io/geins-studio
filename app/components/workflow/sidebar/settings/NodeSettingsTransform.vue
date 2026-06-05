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
    label="Mapping"
    key-placeholder="Output field name"
    value-placeholder="{{output.node-id.field}}"
    expand-title="Mapping JSON"
  />
</template>
