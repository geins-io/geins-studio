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
        // Internal spacing: drives the gaps between stacked input rows and
        // around fields. Bumped above Zelos defaults (8/12/16) for more
        // breathing room inside blocks like if/then/else.
        this.MEDIUM_PADDING = 14;
        this.MEDIUM_LARGE_PADDING = 16;
        this.LARGE_PADDING = 20;
        // Zelos' CORNER_RADIUS (GRID_UNIT = 4) reads too soft. Match the app's
        // input/button radius (~5px) for statement-block corners.
        this.CORNER_RADIUS = 5;
        // Value/reporter blocks keep Zelos' dynamic ROUNDED output shape (so
        // they stay visually distinct from hexagonal Booleans), but Zelos caps
        // its radius at MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH (default 12*GRID_UNIT
        // = 48), which makes short blocks render as full pills (radius =
        // height/2). Lower the cap so the ends are gently rounded rectangles,
        // not pills.
        this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH = 12;
        // Use the ▾ text-glyph dropdown arrow instead of Zelos' baked-in white
        // SVG <image> (whose fill can't be themed via CSS). The glyph is a
        // tspan inside .blocklyDropdownText, so it inherits our foreground fill.
        this.FIELD_DROPDOWN_SVG_ARROW = false;

        // super.init() already built the connection shapes and corner objects,
        // capturing the OLD CORNER_RADIUS / MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH
        // in closures. The block-measuring code reads those constants live, so
        // unless we rebuild the derived artifacts the drawn path (stale) and
        // the measured size (new) desync — block outlines stop enclosing their
        // inputs. Rebuild everything that depends on the constants above.
        this.HEXAGONAL = this.makeHexagonal();
        this.ROUNDED = this.makeRounded();
        this.SQUARED = this.makeSquared();
        this.INSIDE_CORNERS = this.makeInsideCorners();
        this.OUTSIDE_CORNERS = this.makeOutsideCorners();
        this.STATEMENT_INPUT_NOTCH_OFFSET =
          this.NOTCH_OFFSET_LEFT + this.INSIDE_CORNERS.rightWidth;
        this.TOP_ROW_MIN_HEIGHT = this.CORNER_RADIUS;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type AnyCtor = new (...args: any[]) => any;
    const BasePathObject = Blockly.zelos.PathObject as AnyCtor;
    class PaddedPathObject extends BasePathObject {
      // Empty value-input sockets are drop targets: white (card) fill via the
      // .blocklyOutlinePath CSS rule, with a dashed border in the block's own
      // border colour (colourTertiary), set inline here since it's per-block.
      // setOutlinePath runs on every draw, once the outline element exists —
      // applyColour can fire before the outlines are built and miss them.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setOutlinePath(name: any, pathString: any) {
        super.setOutlinePath(name, pathString);
        this.getOutlinePath(name).setAttribute(
          'stroke',
          this.style.colourTertiary,
        );
      }
    }
    class PaddedRenderer extends BaseRenderer {
      makeConstants_() {
        return new PaddedConstants();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makePathObject(root: any, style: any) {
        return new PaddedPathObject(root, style, this.getConstants());
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
/* Zelos paints block/field/menu text white; unreadable on the pale badge
   fills. --foreground is dark-grey in light mode, white in dark mode (flips
   under .dark), so text stays readable in both themes.

   Blockly injects theme-scoped !important rules
   (.padded-zelos-renderer.shadcn-theme .blockly…) that out-specify a bare
   single-class selector, so we mirror that scope and tack on [class] (always
   matches, +1 specificity, tag-agnostic) to win regardless of source order.
   Renderer/theme names come from BlocklyWorkspace ('padded-zelos') and
   useBlocklyTheme ('shadcn'). */
.blocklyText {
  fill: var(--foreground) !important;
}
.padded-zelos-renderer.shadcn-theme .blocklyDropdownText[class],
.padded-zelos-renderer.shadcn-theme .blocklyDropdownText tspan {
  /* tspan = the ▾ arrow; its fill is set inline to the pale block colour. */
  fill: var(--foreground) !important;
}
/* Dropdown menu item labels are HTML (color, not SVG fill). */
.blocklyMenuItemContent[class],
.padded-zelos-renderer.shadcn-theme .blocklyMenuItemContent[class] {
  color: var(--foreground) !important;
}
/* Empty value-input sockets (drop targets): white card surface with a dashed
   border. The dash colour is the block's own border (colourTertiary), set
   inline per-block in PaddedPathObject — so no stroke colour here. */
.blocklyOutlinePath {
  fill: var(--card) !important;
  stroke-width: 1px;
  stroke-dasharray: 4 3;
}
</style>
