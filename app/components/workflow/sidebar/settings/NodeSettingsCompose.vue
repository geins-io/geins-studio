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
    label="Fields"
    description="Each field becomes a key in the output object. Use expressions to reference upstream data."
    key-placeholder="Field name"
    value-placeholder="Value or {{expression}}"
    expand-title="Compose Object JSON"
  />
</template>
