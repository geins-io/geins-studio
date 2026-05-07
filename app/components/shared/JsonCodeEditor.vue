<script setup lang="ts">
import { json } from '@codemirror/lang-json';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, basicSetup, minimalSetup } from 'codemirror';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    readonly?: boolean;
    lineNumbers?: boolean;
    lineWrapping?: boolean;
    expandable?: boolean;
  }>(),
  {
    readonly: false,
    lineNumbers: true,
    lineWrapping: false,
    expandable: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const containerRef = ref<HTMLElement | null>(null);
let view: EditorView | null = null;
const wrapCompartment = new Compartment();
const isExpanded = ref(false);
const expandedHeight = ref<number | null>(null);

function toggleExpand() {
  if (!view) return;
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    view.dispatch({ effects: wrapCompartment.reconfigure([]) });
    nextTick(() => {
      if (!view) return;
      expandedHeight.value = Math.max(view.contentDOM.scrollHeight + 8, 80);
    });
  }
  else {
    view.dispatch({
      effects: wrapCompartment.reconfigure(props.lineWrapping ? [EditorView.lineWrapping] : []),
    });
    expandedHeight.value = null;
  }
}

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
    wrapCompartment.of(props.lineWrapping ? [EditorView.lineWrapping] : []),
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
  <div class="relative min-h-0 flex-1" :style="expandedHeight ? { height: `${expandedHeight}px` } : undefined">
    <div
      ref="containerRef"
      class="h-full overflow-hidden rounded-lg border"
    />
    <button
      v-if="props.expandable"
      class="bg-background/80 text-muted-foreground hover:text-foreground absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded transition-colors"
      :title="isExpanded ? 'Collapse' : 'Expand to fit'"
      @click="toggleExpand"
    >
      <LucideMinimize2 v-if="isExpanded" class="h-3 w-3" />
      <LucideMaximize2 v-else class="h-3 w-3" />
    </button>
  </div>
</template>
