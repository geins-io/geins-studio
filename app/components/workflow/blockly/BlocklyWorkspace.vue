<script setup lang="ts">
import type { ManifestExpressionFunction } from '#shared/types'
import { registerAllBlocks } from './useBlocklyBlocks'
import { useBlocklyGenerator } from './useBlocklyGenerator'
import { useBlocklyParser } from './useBlocklyParser'
import { useBlocklyTheme } from './useBlocklyTheme'
import { buildToolbox } from './useBlocklyToolbox'
import type { ExpressionCompletion } from '../shared/ExpressionInput.vue'
import type { Ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
}>(), {
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { geinsLog, geinsLogError } = useGeinsLog('BlocklyWorkspace')

const { createShadcnBlocklyTheme } = useBlocklyTheme()

const containerRef = ref<HTMLElement>()
const loading = ref(true)

// Injections from workflow sidebar context
const completions = inject<Ref<ExpressionCompletion[]>>('expressionCompletions', ref([]))
const resolveExpression = inject<(expr: string) => string | null>('resolveExpression', () => null)
const expressionFunctions = inject<Ref<ManifestExpressionFunction[]>>('expressionFunctions', ref([]))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let workspace: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Blockly: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let generateCode: ((ws: any) => string) | null = null

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

function onWorkspaceChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (!workspace || !generateCode) return
    const code = generateCode(workspace)
    emit('update:modelValue', code)
  }, 150)
}

function applyTheme() {
  if (!workspace || !Blockly) return
  const theme = createShadcnBlocklyTheme(Blockly, isDark.value)
  workspace.setTheme(theme)
}

async function initBlockly() {
  if (!containerRef.value) return

  try {
    Blockly = await import('blockly')

    Blockly.config.snapRadius = 48
    Blockly.config.connectingSnapRadius = 300

    registerAllBlocks(Blockly, { completions })

    // Register custom renderer with more padding for easier dragging
    class PaddedZelos extends Blockly.zelos.ConstantProvider {
      constructor() {
        super()
        this.FIELD_TEXT_HEIGHT = 20
        this.TALL_INPUT_FIELD_OFFSET_Y = 8
        this.MEDIUM_PADDING = 8
        this.MEDIUM_LARGE_PADDING = 10
        this.LARGE_PADDING = 14
        this.EMPTY_INLINE_INPUT_PADDING = 20
      }
    }
    class PaddedRenderer extends Blockly.zelos.Renderer {
      makeConstants_() {
        return new PaddedZelos()
      }
    }
    Blockly.blockRendering.register('padded-zelos', PaddedRenderer)

    const generator = useBlocklyGenerator(Blockly)
    generateCode = generator.generateCode

    const theme = createShadcnBlocklyTheme(Blockly, isDark.value)

    workspace = Blockly.inject(containerRef.value, {
      theme,
      renderer: 'padded-zelos',
      toolbox: buildToolbox(),
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
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    })

    workspace.addChangeListener(onWorkspaceChange)

    // Load existing expression into workspace
    if (props.modelValue) {
      const { loadExpression } = useBlocklyParser()
      loadExpression(workspace, Blockly, props.modelValue)
    }

    geinsLog('Blockly workspace initialized', {
      completionCount: completions.value.length,
      functionCount: expressionFunctions.value.length,
      hasResolver: resolveExpression !== null,
    })
  }
  catch (err) {
    geinsLogError('Failed to initialize Blockly workspace', err)
  }
  finally {
    loading.value = false
  }
}

watch(isDark, () => {
  applyTheme()
})

onMounted(() => {
  initBlockly()
})

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (workspace) {
    workspace.removeChangeListener(onWorkspaceChange)
    workspace.dispose()
    workspace = null
  }
  Blockly = null
  generateCode = null
})
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
  padding: 4px 0;
}
:deep(.blocklyTreeRow) {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  margin: 1px 4px;
}
:deep(.blocklyTreeSelected) {
  background-color: var(--accent) !important;
}
:deep(.blocklyTrash) {
  display: none;
}
:deep(.blocklyScrollbarVertical),
:deep(.blocklyScrollbarHorizontal) {
  opacity: 0;
  transition: opacity 0.2s;
}
:deep(.blocklyMainWorkspaceScrollbar:hover) .blocklyScrollbarVertical,
:deep(.blocklyMainWorkspaceScrollbar:hover) .blocklyScrollbarHorizontal {
  opacity: 0.4;
}
:deep(.blocklySvg:hover .blocklyScrollbarVertical),
:deep(.blocklySvg:hover .blocklyScrollbarHorizontal) {
  opacity: 0.4;
}
</style>

<style>
.blocklyDropDownDiv {
  z-index: 100000 !important;
}
.blocklyWidgetDiv {
  z-index: 100000 !important;
  position: fixed !important;
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
