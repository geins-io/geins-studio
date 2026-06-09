<script setup lang="ts">
import {
  LucideChevronDown,
  LucideChevronRight,
  LucideCopy,
  LucideCheck,
} from '#components';

interface Props {
  input?: Record<string, unknown> | null;
  sourceLabel?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  input: null,
  sourceLabel: null,
});

const hasInput = computed(
  () => !!props.input && Object.keys(props.input).length > 0,
);

const formatted = computed(() =>
  hasInput.value ? JSON.stringify(props.input, null, 2) : '',
);

const expanded = ref(true);

const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const copyInput = async () => {
  if (!formatted.value) return;
  try {
    await navigator.clipboard.writeText(formatted.value);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    // clipboard unavailable — silently ignore
  }
};

onUnmounted(() => {
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<template>
  <div class="bg-card flex flex-col rounded-lg border shadow-xs">
    <div class="flex items-center justify-between border-b px-4 py-2">
      <button
        class="flex items-center gap-2 text-left focus:outline-none focus-visible:outline-none"
        @click="expanded = !expanded"
      >
        <component
          :is="expanded ? LucideChevronDown : LucideChevronRight"
          class="text-muted-foreground h-4 w-4 shrink-0"
        />
        <h2 class="text-sm font-medium">Workflow input</h2>
        <span
          v-if="sourceLabel && hasInput"
          class="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs"
        >
          {{ sourceLabel }}
        </span>
      </button>
      <button
        v-if="hasInput"
        class="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1 transition-colors"
        :title="copied ? 'Copied!' : 'Copy input'"
        @click="copyInput"
      >
        <component
          :is="copied ? LucideCheck : LucideCopy"
          class="h-3.5 w-3.5"
        />
      </button>
    </div>
    <div v-if="expanded">
      <div
        v-if="!hasInput"
        class="text-muted-foreground p-4 text-center text-sm"
      >
        No input was recorded for this execution.
      </div>
      <pre
        v-else
        class="bg-secondary/50 dark:bg-secondary/70 max-h-80 overflow-auto rounded-b-lg p-4 font-mono text-xs"
        >{{ formatted }}</pre
      >
    </div>
  </div>
</template>
