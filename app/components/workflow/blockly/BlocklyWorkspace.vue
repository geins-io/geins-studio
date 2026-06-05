<script setup lang="ts">
import type { ManifestExpressionFunction } from '#shared/types';
import { registerAllBlocks } from './useBlocklyBlocks';
import { useBlocklyGenerator } from './useBlocklyGenerator';
import { useBlocklyParser } from './useBlocklyParser';
import { useBlocklyTheme } from './useBlocklyTheme';
import { buildToolbox } from './useBlocklyToolbox';
import type { ExpressionCompletion } from '../shared/ExpressionInput.vue';
import type { Ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    completions?: ExpressionCompletion[];
    expressionFunctions?: ManifestExpressionFunction[];
  }>(),
  {
    modelValue: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { geinsLog, geinsLogError } = useGeinsLog('BlocklyWorkspace');

const { createShadcnBlocklyTheme } = useBlocklyTheme();

const containerRef = ref<HTMLElement>();
const loading = ref(true);

// Use props if provided (teleported context), fall back to inject
const injectedCompletions = inject<Ref<ExpressionCompletion[]>>(
  'expressionCompletions',
  ref([]),
);
const injectedFunctions = inject<Ref<ManifestExpressionFunction[]>>(
  'expressionFunctions',
  ref([]),
);
const resolveExpression = inject<(expr: string) => string | null>(
  'resolveExpression',
  () => null,
);

const completions = computed(
  () => props.completions ?? injectedCompletions.value,
);
const expressionFunctions = computed(
  () => props.expressionFunctions ?? injectedFunctions.value,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workspace: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Blockly: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generateCode: ((ws: any) => string) | null = null;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');

function onWorkspaceChange() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (!workspace || !generateCode) return;
    const code = generateCode(workspace);
    emit('update:modelValue', code);
  }, 150);
}

function applyTheme() {
  if (!workspace || !Blockly) return;
  const theme = createShadcnBlocklyTheme(Blockly, isDark.value);
  workspace.setTheme(theme);
}

async function initBlockly() {
  if (!containerRef.value) return;

  try {
    Blockly = await import('blockly');

    Blockly.config.snapRadius = 48;
    Blockly.config.connectingSnapRadius = 300;
    Blockly.ContextMenuRegistry.registry.reset();

    registerAllBlocks(Blockly, {
      completions,
      expressionFunctions: expressionFunctions.value,
    });

    const BaseConstants = Blockly.zelos.ConstantProvider;
    const BaseRenderer = Blockly.zelos.Renderer;
    class PaddedConstants extends BaseConstants {
      init() {
        super.init();
        this.MEDIUM_PADDING = 10;
        this.MEDIUM_LARGE_PADDING = 14;
        this.LARGE_PADDING = 18;
      }
    }
    class PaddedRenderer extends BaseRenderer {
      makeConstants_() {
        return new PaddedConstants();
      }
    }
    try {
      Blockly.blockRendering.unregister('padded-zelos');
    } catch {
      /* first load */
    }
    Blockly.blockRendering.register('padded-zelos', PaddedRenderer);

    const generator = useBlocklyGenerator(Blockly, expressionFunctions.value);
    generateCode = generator.generateCode;

    const theme = createShadcnBlocklyTheme(Blockly, isDark.value);

    workspace = Blockly.inject(containerRef.value, {
      theme,
      renderer: 'padded-zelos',
      toolbox: buildToolbox(expressionFunctions.value),
      grid: {
        spacing: 20,
        length: 3,
        colour: isDark.value ? '#27272a' : '#e4e4e7',
        snap: true,
      },
      zoom: {
        controls: false,
        wheel: true,
        startScale: 0.8,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      sounds: false,
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    });

    workspace.addChangeListener(onWorkspaceChange);

    const svgEl = workspace.getParentSvg();
    if (svgEl) {
      svgEl.addEventListener('contextmenu', (e: Event) => e.preventDefault());
    }

    // Load existing expression into workspace
    if (props.modelValue) {
      const { loadExpression, setManifestFunctions } = useBlocklyParser();
      setManifestFunctions(expressionFunctions.value);
      loadExpression(workspace, Blockly, props.modelValue);
      workspace.scrollCenter();
    }

    geinsLog('Blockly workspace initialized', {
      completionCount: completions.value.length,
      functionCount: expressionFunctions.value.length,
      hasResolver: resolveExpression !== null,
    });
  } catch (err) {
    geinsLogError('Failed to initialize Blockly workspace', err);
  } finally {
    loading.value = false;
  }
}

watch(isDark, () => {
  applyTheme();
});

// The manifest loads asynchronously, so expressionFunctions may be empty at
// first inject. When it resolves (or changes), re-register the generic
// function blocks/generator and refresh the toolbox so new functions appear.
watch(expressionFunctions, (fns) => {
  if (!Blockly || !workspace) return;
  registerAllBlocks(Blockly, { completions, expressionFunctions: fns });
  generateCode = useBlocklyGenerator(Blockly, fns).generateCode;
  useBlocklyParser().setManifestFunctions(fns);
  workspace.updateToolbox(buildToolbox(fns));
});

onMounted(() => {
  initBlockly();
});

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (workspace) {
    workspace.removeChangeListener(onWorkspaceChange);
    workspace.dispose();
    workspace = null;
  }
  Blockly = null;
  generateCode = null;
});
</script>

<template>
  <div class="relative h-full w-full">
    <!-- Loading spinner -->
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center"
    >
      <LucideLoader2 class="text-muted-foreground size-8 animate-spin" />
    </div>

    <!-- Blockly container -->
    <div
      ref="containerRef"
      class="h-full w-full"
      :class="{ 'opacity-0': loading }"
    />
  </div>
</template>

<style scoped>
:deep(.blocklyToolboxDiv) {
  border-right: 1px solid var(--border);
  padding: 12px 0;
  background: var(--color-background) !important;
}
:deep(.blocklyTreeRow) {
  padding: 8px 12px 8px 10px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  border-radius: 6px;
  margin: 2px 6px;
  transition: background-color 0.15s;
  cursor: pointer;
}
:deep(.blocklyTreeRow:hover) {
  background-color: var(--color-accent) !important;
}
:deep(.blocklyTreeSelected) {
  background-color: var(--color-accent) !important;
}
:deep(.blocklyTreeLabel) {
  font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
}
:deep(.blocklyTreeIcon) {
  width: 4px !important;
  height: 14px !important;
  border-radius: 2px;
  margin-right: 8px;
}
:deep(.blocklyFlyoutBackground) {
  fill-opacity: 1;
  stroke: var(--border);
  stroke-width: 1;
}
:deep(.blocklyTrash) {
  display: none;
}
:deep(.blocklyScrollbarVertical),
:deep(.blocklyScrollbarHorizontal) {
  opacity: 0;
  transition: opacity 0.2s;
}
:deep(.blocklySvg:hover .blocklyScrollbarVertical),
:deep(.blocklySvg:hover .blocklyScrollbarHorizontal) {
  opacity: 0.4;
}
</style>

<style>
.blocklyDropDownDiv {
  z-index: 100000 !important;
  pointer-events: auto !important;
}
.blocklyWidgetDiv {
  z-index: 100000 !important;
  position: fixed !important;
  pointer-events: auto !important;
}
.blocklyWidgetDiv .blocklyHtmlInput {
  background-color: var(--color-muted);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.blocklyTooltipDiv {
  z-index: 100000 !important;
}
</style>
