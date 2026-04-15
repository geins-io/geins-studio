<script setup lang="ts">
import { ChevronDown, ChevronUp, ExternalLink, PanelBottomClose } from 'lucide-vue-next'
import { ref, computed, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps<{
  executionId?: string | null
}>()

const STORAGE_KEY_HEIGHT = 'workflow.logsPanel.height'
const MIN_HEIGHT = 160
const MAX_HEIGHT_RATIO = 0.8
const DEFAULT_HEIGHT = 280

function readNumber(key: string, fallback: number) {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? n : fallback
}

const isOpen = ref(false)
const height = ref(readNumber(STORAGE_KEY_HEIGHT, DEFAULT_HEIGHT))

watch(height, (v) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY_HEIGHT, String(Math.round(v)))
})

function toggle() {
  isOpen.value = !isOpen.value
}

defineExpose({
  open: () => {
    isOpen.value = true
  },
  close: () => {
    isOpen.value = false
  },
  toggle,
})

// --- Resize (top-edge drag) ---
const isResizing = ref(false)
let startY = 0
let startHeight = 0

function onResizeStart(e: PointerEvent) {
  if (isPoppedOut.value) return
  isResizing.value = true
  startY = e.clientY
  startHeight = height.value
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd, { once: true })
  e.preventDefault()
}

function onResizeMove(e: PointerEvent) {
  const delta = startY - e.clientY
  const max = Math.max(MIN_HEIGHT, Math.floor(window.innerHeight * MAX_HEIGHT_RATIO))
  height.value = Math.min(max, Math.max(MIN_HEIGHT, startHeight + delta))
}

function onResizeEnd() {
  isResizing.value = false
  window.removeEventListener('pointermove', onResizeMove)
}

// --- Pop-out window ---
const isPoppedOut = ref(false)
const popoutContainer = ref<HTMLElement | null>(null)
let popWindow: Window | null = null

function copyStyles(target: Document) {
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      if (sheet.href) {
        const link = target.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.head.appendChild(link)
      } else {
        const node = sheet.ownerNode as HTMLStyleElement | null
        if (node?.textContent) {
          const style = target.createElement('style')
          style.textContent = node.textContent
          target.head.appendChild(style)
        }
      }
    } catch {
      // Cross-origin stylesheet — skipped
    }
  })
}

async function popOut() {
  if (isPoppedOut.value) return
  const w = window.open('', 'workflow-logs-panel', 'width=1000,height=640')
  if (!w) return
  w.document.title = 'Workflow Logs'
  copyStyles(w.document)
  w.document.documentElement.className = document.documentElement.className
  w.document.body.className = document.body.className
  w.document.body.style.margin = '0'
  w.document.body.style.height = '100vh'
  const root = w.document.createElement('div')
  root.id = 'logs-popout-root'
  root.style.cssText = 'height:100vh; display:flex; flex-direction:column; background:var(--background);'
  w.document.body.appendChild(root)

  popWindow = w
  popoutContainer.value = root
  isPoppedOut.value = true
  if (!isOpen.value) isOpen.value = true

  const handleClose = () => {
    isPoppedOut.value = false
    popoutContainer.value = null
    popWindow = null
  }
  w.addEventListener('beforeunload', handleClose)
  // Close the popout if the parent unloads
  window.addEventListener('beforeunload', () => w.close(), { once: true })
  await nextTick()
}

function dockBack() {
  popWindow?.close()
  isPoppedOut.value = false
  popoutContainer.value = null
  popWindow = null
}

onBeforeUnmount(() => {
  popWindow?.close()
  window.removeEventListener('pointermove', onResizeMove)
})

const bodyStyle = computed(() => ({
  height: `${height.value}px`,
}))
</script>

<template>
  <div class="bg-background flex shrink-0 flex-col border-t">
    <!-- Header -->
    <div
      class="flex h-9 shrink-0 cursor-pointer items-center justify-between border-b px-3 select-none"
      @click="toggle">
      <div class="flex items-center gap-2">
        <component :is="isOpen ? ChevronDown : ChevronUp" class="text-muted-foreground size-4" />
        <span class="text-sm font-medium">Logs</span>
        <span v-if="isPoppedOut" class="text-muted-foreground text-xs">(popped out)</span>
      </div>
      <div class="flex items-center gap-1" @click.stop>
        <button
          v-if="!isPoppedOut"
          class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded"
          title="Open in new window"
          @click="popOut">
          <ExternalLink class="size-3.5" />
        </button>
        <button
          v-else
          class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded"
          title="Dock back"
          @click="dockBack">
          <PanelBottomClose class="size-3.5" />
        </button>
      </div>
    </div>

    <!-- Inline body: visible when open. Shows a stub when popped out, otherwise hosts the content. -->
    <div
      v-if="isOpen"
      class="bg-background relative shrink-0"
      :style="bodyStyle">
      <div
        v-if="!isPoppedOut"
        class="hover:bg-primary/40 absolute inset-x-0 -top-0.5 z-10 h-1 cursor-ns-resize"
        :class="{ 'bg-primary/40': isResizing }"
        @pointerdown="onResizeStart" />
      <div
        v-if="isPoppedOut"
        class="text-muted-foreground flex h-full items-center justify-center gap-2 p-6 text-sm">
        <ExternalLink class="size-4" />
        Logs panel is open in another window
      </div>
      <Teleport v-else :to="popoutContainer ?? undefined" :disabled="!isPoppedOut">
        <div class="bg-background flex h-full flex-col overflow-auto">
          <slot>
            <div class="text-muted-foreground flex h-full flex-col items-center justify-center gap-1 p-6 text-sm">
              <div v-if="props.executionId">
                Watching execution
                <code class="bg-muted text-foreground ml-1 rounded px-1.5 py-0.5 font-mono text-xs">{{ props.executionId }}</code>
              </div>
              <div v-else>Logs panel — run a workflow to see logs.</div>
            </div>
          </slot>
        </div>
      </Teleport>
    </div>

    <!-- When popped out, mount the content in the external window. -->
    <Teleport v-if="isPoppedOut && popoutContainer" :to="popoutContainer">
      <div class="bg-background flex h-full flex-col overflow-auto">
        <slot>
          <div class="text-muted-foreground flex h-full flex-col items-center justify-center gap-1 p-6 text-sm">
            <div v-if="props.executionId">
              Watching execution
              <code class="bg-muted text-foreground ml-1 rounded px-1.5 py-0.5 font-mono text-xs">{{ props.executionId }}</code>
            </div>
            <div v-else>Logs panel — run a workflow to see logs.</div>
          </div>
        </slot>
      </div>
    </Teleport>
  </div>
</template>
