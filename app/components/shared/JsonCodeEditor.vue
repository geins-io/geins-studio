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
    expandable?: boolean;
    expandTitle?: string;
  }>(),
  {
    readonly: false,
    lineNumbers: true,
    lineWrapping: false,
    expandable: false,
    expandTitle: 'JSON',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const containerRef = ref<HTMLElement | null>(null);
const modalEditorRef = ref<HTMLElement | null>(null);
let view: EditorView | null = null;
let modalView: EditorView | null = null;
const isExpanded = ref(false);
const copied = ref(false);

async function copyToClipboard() {
  await navigator.clipboard.writeText(props.modelValue);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1500);
}

function openModal() {
  isExpanded.value = true;
  nextTick(() => {
    if (!modalEditorRef.value) return;
    modalView = new EditorView({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        json(),
        appTheme,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
      ],
      parent: modalEditorRef.value,
    });
  });
}

function closeModal() {
  isExpanded.value = false;
  modalView?.destroy();
  modalView = null;
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
  ];

  if (props.lineWrapping) {
    extensions.push(EditorView.lineWrapping);
  }

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
  modalView?.destroy();
  modalView = null;
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
  <div class="relative min-h-0 flex-1">
    <div
      ref="containerRef"
      class="h-full overflow-hidden rounded-lg border"
    />
    <button
      v-if="props.expandable"
      class="text-muted-foreground hover:text-foreground absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded transition-colors"
      title="Expand"
      @click="openModal"
    >
      <LucideMaximize2 class="h-3 w-3" />
    </button>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isExpanded" class="fixed inset-0 z-[9999] flex items-center justify-center">
          <div class="absolute inset-0 bg-black/50" @click="closeModal" />
          <div class="bg-background relative z-10 flex h-[70vh] w-[80vw] max-w-5xl flex-col overflow-hidden rounded-xl border shadow-2xl">
            <div class="flex items-center justify-between border-b px-4 py-2">
              <span class="text-muted-foreground text-xs font-medium uppercase tracking-wider">{{ props.expandTitle }}</span>
              <div class="flex items-center gap-1">
                <button
                  class="text-muted-foreground hover:text-foreground flex h-6 w-6 items-center justify-center rounded transition-colors"
                  :title="copied ? 'Copied!' : 'Copy to clipboard'"
                  @click="copyToClipboard"
                >
                  <LucideCheck v-if="copied" class="h-3.5 w-3.5 text-green-500" />
                  <LucideCopy v-else class="h-3.5 w-3.5" />
                </button>
                <button
                  class="text-muted-foreground hover:text-foreground flex h-6 w-6 items-center justify-center rounded transition-colors"
                  @click="closeModal"
                >
                  <LucideX class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div ref="modalEditorRef" class="min-h-0 flex-1 overflow-hidden" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
