<script setup lang="ts">
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup, minimalSetup } from 'codemirror';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    lineNumbers?: boolean;
    lineWrapping?: boolean;
  }>(),
  {
    readonly: false,
    lineNumbers: true,
    lineWrapping: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const containerRef = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

const appTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '13px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.ͼe': {
    color: '#e17900',
  },
  '.ͼc': {
    color: '#009688',
  },
  '.ͼd': {
    color: '#4CAF50',
  },
  '.cm-scroller': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: 'var(--foreground)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    borderRight: '1px solid var(--border)',
  },
  '.cm-gutterElement': {
    padding: '0 10px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--accent)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 4%, transparent)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--foreground)',
  },
});

onMounted(() => {
  if (!containerRef.value) return;

  const extensions = [
    props.lineNumbers ? basicSetup : minimalSetup,
    json(),
    appTheme,
  ];

  if (props.readonly) {
    extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
  }
  else {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
    );
  }

  if (props.lineWrapping) {
    extensions.push(EditorView.lineWrapping);
  }

  view = new EditorView({
    doc: props.modelValue,
    extensions,
    parent: containerRef.value,
  });
});

onUnmounted(() => {
  view?.destroy();
  view = null;
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === newValue) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newValue },
    });
  },
);
</script>

<template>
  <div
    ref="containerRef"
    class="min-h-0 flex-1 overflow-hidden rounded-lg border"
  />
</template>
