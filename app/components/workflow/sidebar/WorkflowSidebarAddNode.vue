<script setup lang="ts">
import type { PaletteItem } from '#shared/types'
import type { ManifestAction } from '@/composables/useWorkflowManifest'
import type { Component } from 'vue'
import LitiumSymbol from '~/assets/logos/litium-symbol.svg'
import MonitorSymbol from '~/assets/logos/monitor-symbol.svg'

// ─── Props / emits ─────────────────────────────────────────────────
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  add: [item: PaletteItem]
}>()

// ─── Manifest data ─────────────────────────────────────────────────
const manifestStore = useWorkflowManifest()
const {
  actions: manifestActions,
  nodeTypes: manifestNodeTypes,
  actionCategories: manifestActionCategories,
} = manifestStore

const { resolveIcon } = useLucideIcon()

// ─── Node-type metadata (for the root category cards) ──────────────
const NODE_TYPE_META: Record<string, { icon: string, color: string, label: string, description?: string }> = {
  action: { icon: 'Globe', color: 'text-blue-500', label: 'Action in an app', description: 'Perform an action using a provider' },
  condition: { icon: 'GitBranch', color: 'text-yellow-500', label: 'Conditions' },
  iterator: { icon: 'Repeat', color: 'text-purple-500', label: 'Iterators' },
  delay: { icon: 'Timer', color: 'text-orange-500', label: 'Delays' },
  workflow: { icon: 'Workflow', color: 'text-blue-500', label: 'Workflows' },
}

/** Extract the provider prefix from a dotted action name: "monitor.buildPartQuery" → "monitor" */
function getProviderFromName(actionName: string): string {
  const dotIndex = actionName.indexOf('.')
  return dotIndex > 0 ? actionName.substring(0, dotIndex) : actionName
}

/** Titlecase a provider prefix: "monitor" → "Monitor" */
function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Provider icon lookup — first tries manifest actionCategories, then falls back to defaults */
const PROVIDER_ICON_DEFAULTS: Record<string, string> = {
  geins: 'Box',
  monitor: 'Activity',
  net: 'Globe',
  storage: 'Database',
  transform: 'ArrowRightLeft',
  common: 'Settings',
}

const PROVIDER_LOGOS: Record<string, Component> = {
  litium: LitiumSymbol,
  monitor: MonitorSymbol,
}

function getProviderLogo(providerKey: string): Component | null {
  return PROVIDER_LOGOS[providerKey] ?? null
}

function getProviderIcon(providerKey: string): Component | null {
  // Check if manifestActionCategories has a matching entry
  const cat = manifestActionCategories.value.find(c => c.name === providerKey)
  if (cat?.icon) return resolveIcon(cat.icon)
  return resolveIcon(PROVIDER_ICON_DEFAULTS[providerKey] ?? 'Package')
}

function getProviderDisplayName(providerKey: string): string {
  const cat = manifestActionCategories.value.find(c => c.name === providerKey)
  if (cat?.displayName) return cat.displayName
  return titleCase(providerKey)
}

/** Group actions by their provider prefix */
const actionsByProvider = computed(() => {
  const map = new Map<string, ManifestAction[]>()
  for (const a of manifestActions.value) {
    const provider = getProviderFromName(a.name)
    const list = map.get(provider)
    if (list) list.push(a)
    else map.set(provider, [a])
  }
  return map
})

// ─── View stack types ──────────────────────────────────────────────
// Items renderable at any panel level.
type CategoryViewItem = {
  type: 'category'
  key: string
  label: string
  icon: Component | null
  color: string
  count: number
}

type ProviderViewItem = {
  type: 'provider'
  key: string
  label: string
  icon: Component | null
  logo: Component | null
  count: number
}

type NodeViewItem = {
  type: 'node'
  item: PaletteItem
  icon: Component | null
  logo?: Component | null
  color: string
  category?: string
}

type ViewItem = CategoryViewItem | ProviderViewItem | NodeViewItem

interface ViewStack {
  id: string
  title: string
  icon?: Component | null
  logo?: Component | null
  color?: string
  items: ViewItem[]
  hasSearch: boolean
  search: string
}

// ─── View stack state ──────────────────────────────────────────────
const viewStacks = ref<ViewStack[]>([])
const transitionDirection = ref<'in' | 'out'>('in')

const activeStack = computed<ViewStack | null>(() =>
  viewStacks.value.length > 0 ? viewStacks.value[viewStacks.value.length - 1]! : null,
)

const canGoBack = computed(() => viewStacks.value.length > 1)

function pushStack(stack: Omit<ViewStack, 'id' | 'search'>) {
  transitionDirection.value = 'in'
  viewStacks.value.push({
    ...stack,
    id: `${stack.title}-${Date.now()}`,
    search: '',
  })
}

function popStack() {
  if (viewStacks.value.length > 1) {
    transitionDirection.value = 'out'
    viewStacks.value.pop()
  }
}

function _resetStacks() {
  viewStacks.value = []
  buildRootStack()
}

// ─── Build the root categories panel ───────────────────────────────
function buildRootStack() {
  const items: ViewItem[] = []

  // Actions category — count from manifest
  const actionCount = manifestActions.value.length
  if (actionCount > 0) {
    const meta = NODE_TYPE_META.action!
    items.push({
      type: 'category',
      key: 'action',
      label: meta.label,
      icon: resolveIcon(meta.icon),
      color: meta.color,
      count: actionCount,
    })
  }

  // Non-action node types (condition, iterator, delay, etc.)
  for (const nt of manifestNodeTypes.value) {
    if (nt.type === 'trigger' || nt.type === 'action') continue
    const meta = NODE_TYPE_META[nt.type] ?? { icon: 'Zap', color: 'text-blue-500', label: nt.displayName || nt.type }
    items.push({
      type: 'category',
      key: nt.type,
      label: meta.label,
      icon: resolveIcon(meta.icon),
      color: meta.color,
      count: 1,
    })
  }

  pushStack({
    title: 'Add node',
    items,
    hasSearch: true,
  })
}

// ─── Build the providers panel (grouped by action name prefix) ──────
function buildProvidersStack() {
  const items: ViewItem[] = []

  // Sort providers alphabetically
  const providers = [...actionsByProvider.value.entries()].sort(([a], [b]) => a.localeCompare(b))

  for (const [providerKey, providerActions] of providers) {
    items.push({
      type: 'provider',
      key: providerKey,
      label: getProviderDisplayName(providerKey),
      icon: getProviderIcon(providerKey),
      logo: getProviderLogo(providerKey),
      count: providerActions.length,
    })
  }

  const meta = NODE_TYPE_META.action!
  pushStack({
    title: meta.label,
    icon: resolveIcon(meta.icon),
    color: meta.color,
    items,
    hasSearch: true,
  })
}

// ─── Build a provider's actions panel ──────────────────────────────
function buildActionsStack(providerKey: string, label: string, icon: Component | null, logo?: Component | null) {
  const actions = actionsByProvider.value.get(providerKey) ?? []

  // Sort actions by category first, then by display name
  const sorted = [...actions].sort((a, b) => {
    const catCmp = (a.category ?? '').localeCompare(b.category ?? '')
    if (catCmp !== 0) return catCmp
    return (a.displayName || a.name).localeCompare(b.displayName || b.name)
  })

  const items: NodeViewItem[] = sorted.map(a => ({
    type: 'node' as const,
    item: {
      nodeType: 'action',
      id: a.name,
      label: a.displayName || a.name,
      description: a.description,
      actionName: a.name,
    },
    icon: icon,
    logo,
    color: 'text-blue-500',
    category: a.category,
  }))

  pushStack({
    title: label,
    icon,
    logo,
    items,
    hasSearch: true,
  })
}

// ─── Direct-add for single-node categories (condition, delay, etc.) ─
function addSingleNodeType(nodeTypeKey: string) {
  const nt = manifestNodeTypes.value.find(n => n.type === nodeTypeKey)
  if (!nt) return

  const item: PaletteItem = {
    nodeType: nt.type,
    id: nt.type,
    label: nt.displayName || nt.type,
    description: nt.description,
  }
  emit('add', item)
}

// ─── Item click handler ────────────────────────────────────────────
function onItemClick(viewItem: ViewItem) {
  if (viewItem.type === 'category') {
    if (viewItem.key === 'action') {
      buildProvidersStack()
    }
    else {
      // Single-item category — add directly
      addSingleNodeType(viewItem.key)
    }
  }
  else if (viewItem.type === 'provider') {
    buildActionsStack(viewItem.key, viewItem.label, viewItem.icon, viewItem.logo)
  }
  else if (viewItem.type === 'node') {
    emit('add', viewItem.item)
  }
}

// ─── Drag support (leaf nodes only) ────────────────────────────────
function onDragStart(event: DragEvent, item: PaletteItem) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
  }
}

// ─── Search filtering ──────────────────────────────────────────────
const filteredItems = computed<ViewItem[]>(() => {
  const stack = activeStack.value
  if (!stack) return []

  const q = stack.search.trim().toLowerCase()
  if (!q) return stack.items

  return stack.items.filter((item) => {
    if (item.type === 'category') {
      return item.label.toLowerCase().includes(q)
    }
    if (item.type === 'provider') {
      return item.label.toLowerCase().includes(q)
    }
    if (item.type === 'node') {
      return (
        item.item.label.toLowerCase().includes(q)
        || (item.item.description ?? '').toLowerCase().includes(q)
        || (item.item.actionName ?? '').toLowerCase().includes(q)
      )
    }
    return false
  })
})

// ─── Category divider helper ───────────────────────────────────────
function showCategoryDivider(item: NodeViewItem, items: ViewItem[]): boolean {
  if (!item.category) return false
  const idx = items.indexOf(item)
  if (idx <= 0) return true
  const prev = items[idx - 1]
  if (prev?.type !== 'node') return true
  return prev.category !== item.category
}

// ─── Global search (from root level, search across all actions) ────
const globalSearchResults = computed<NodeViewItem[]>(() => {
  const stack = activeStack.value
  if (!stack || viewStacks.value.length !== 1) return []

  const q = stack.search.trim().toLowerCase()
  if (!q) return []

  // Search across all actions in the manifest
  return manifestActions.value
    .filter(a =>
      (a.displayName || a.name).toLowerCase().includes(q)
      || (a.description ?? '').toLowerCase().includes(q)
      || a.name.toLowerCase().includes(q),
    )
    .map(a => ({
      type: 'node' as const,
      item: {
        nodeType: 'action',
        id: a.name,
        label: a.displayName || a.name,
        description: a.description,
        actionName: a.name,
      },
      icon: a.icon ? resolveIcon(a.icon) : resolveIcon('Zap'),
      logo: getProviderLogo(getProviderFromName(a.name)),
      color: 'text-blue-500',
    }))
})

// Also build palette items for non-action node types in global search
const globalNodeTypeResults = computed<NodeViewItem[]>(() => {
  const stack = activeStack.value
  if (!stack || viewStacks.value.length !== 1) return []

  const q = stack.search.trim().toLowerCase()
  if (!q) return []

  return manifestNodeTypes.value
    .filter(nt => nt.type !== 'trigger' && nt.type !== 'action')
    .filter(nt =>
      (nt.displayName || nt.type).toLowerCase().includes(q)
      || (nt.description ?? '').toLowerCase().includes(q),
    )
    .map((nt) => {
      const meta = NODE_TYPE_META[nt.type] ?? { icon: 'Zap', color: 'text-blue-500', label: nt.displayName || nt.type }
      return {
        type: 'node' as const,
        item: {
          nodeType: nt.type,
          id: nt.type,
          label: nt.displayName || nt.type,
          description: nt.description,
        },
        icon: resolveIcon(meta.icon),
        color: meta.color,
      }
    })
})

const isGlobalSearch = computed(() => {
  const stack = activeStack.value
  return stack && viewStacks.value.length === 1 && stack.search.trim().length > 0
})

const allGlobalResults = computed<NodeViewItem[]>(() => [
  ...globalNodeTypeResults.value,
  ...globalSearchResults.value,
])

// ─── Init stack on open ────────────────────────────────────────────
watch(open, (isOpen) => {
  if (isOpen && viewStacks.value.length === 0) {
    buildRootStack()
  }
  if (!isOpen) {
    // Reset when closed so re-opening starts fresh
    viewStacks.value = []
  }
})

// Build initial stack if already open
onMounted(() => {
  if (open.value && viewStacks.value.length === 0) {
    buildRootStack()
  }
})

function onSearchInput(value: string) {
  if (activeStack.value) {
    activeStack.value.search = value
  }
}
</script>

<template>
  <div
    class="bg-background overflow-hidden border-l transition-[width] duration-200 ease-in-out"
    :class="open ? 'w-80' : 'w-0 border-l-0'"
  >
    <div class="relative h-full w-80 overflow-hidden">
      <!-- Loading state -->
      <div
        v-if="manifestStore.loading.value && !activeStack"
        class="text-muted-foreground flex h-full items-center justify-center text-sm"
      >
        Loading node types…
      </div>

      <!-- Panel transition container -->
      <Transition
        v-else-if="activeStack"
        :name="`panel-slide-${transitionDirection}`"
        mode="out-in"
      >
        <div
          :key="activeStack.id"
          class="absolute inset-0 flex flex-col"
        >
          <!-- Panel header -->
          <div class="flex items-center gap-2 border-b px-4 py-3">
            <button
              v-if="canGoBack"
              class="hover:bg-accent -ml-1 rounded p-1"
              title="Back"
              @click="popStack"
            >
              <LucideArrowLeft class="h-4 w-4" />
            </button>
            <component
              :is="activeStack.logo"
              v-if="activeStack.logo"
              class="h-4 w-4 shrink-0 dark:invert"
            />
            <component
              :is="activeStack.icon"
              v-else-if="activeStack.icon"
              class="h-4 w-4 shrink-0"
              :class="activeStack.color"
            />
            <span class="min-w-0 flex-1 truncate text-sm font-medium">
              {{ activeStack.title }}
            </span>
            <button class="hover:bg-accent rounded p-1.5" title="Close" @click="open = false">
              <LucideX class="h-4 w-4" />
            </button>
          </div>

          <!-- Search bar -->
          <div v-if="activeStack.hasSearch" class="border-b px-4 py-2">
            <div class="relative">
              <LucideSearch class="text-muted-foreground pointer-events-none absolute top-2 left-2 h-4 w-4" />
              <input
                :value="activeStack.search"
                type="text"
                placeholder="Search…"
                class="bg-background focus:ring-ring w-full rounded-md border py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:outline-none"
                @input="onSearchInput(($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <!-- Panel content -->
          <div class="flex-1 overflow-y-auto p-3" style="scrollbar-gutter: stable;">
            <!-- Global search results (root level only, when searching) -->
            <template v-if="isGlobalSearch">
              <div v-if="allGlobalResults.length > 0" class="space-y-1">
                <button
                  v-for="viewItem in allGlobalResults"
                  :key="viewItem.item.id"
                  class="hover:bg-muted/50 flex w-full items-start gap-2.5 rounded-md border p-2.5 text-left transition-colors"
                  draggable="true"
                  @dragstart="(e) => onDragStart(e, viewItem.item)"
                  @click="onItemClick(viewItem)"
                >
                  <component
                    :is="viewItem.logo"
                    v-if="viewItem.logo"
                    class="mt-0.5 h-4 w-4 shrink-0 dark:invert"
                  />
                  <component
                    :is="viewItem.icon"
                    v-else
                    class="mt-0.5 h-4 w-4 shrink-0"
                    :class="viewItem.color"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">{{ viewItem.item.label }}</div>
                    <div v-if="viewItem.item.actionName" class="text-muted-foreground font-mono text-[10px]">
                      {{ viewItem.item.actionName }}
                    </div>
                    <div v-if="viewItem.item.description" class="text-muted-foreground line-clamp-2 text-xs">
                      {{ viewItem.item.description }}
                    </div>
                  </div>
                </button>
              </div>
              <div v-else class="text-muted-foreground py-8 text-center text-sm">
                No nodes match your search
              </div>
            </template>

            <!-- Normal panel items -->
            <template v-else>
              <div v-if="filteredItems.length > 0" class="space-y-1">
                <template v-for="viewItem in filteredItems" :key="viewItem.type === 'node' ? viewItem.item.id : viewItem.key">
                  <!-- Category card (root level) -->
                  <button
                    v-if="viewItem.type === 'category'"
                    class="hover:bg-muted/50 group flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors"
                    @click="onItemClick(viewItem)"
                  >
                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                      :class="[viewItem.color]"
                    >
                      <component :is="viewItem.icon" class="h-5 w-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium">{{ viewItem.label }}</div>
                      <div v-if="viewItem.key === 'action'" class="text-muted-foreground text-xs">
                        Perform an action using a provider
                      </div>
                      <div v-else class="text-muted-foreground text-xs">
                        {{ viewItem.count }} {{ viewItem.count === 1 ? 'node' : 'nodes' }}
                      </div>
                    </div>
                    <LucideChevronRight class="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <!-- Provider card (actions sub-level) -->
                  <button
                    v-else-if="viewItem.type === 'provider'"
                    class="hover:bg-muted/50 group flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors"
                    @click="onItemClick(viewItem)"
                  >
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border">
                      <component
                        :is="viewItem.logo"
                        v-if="viewItem.logo"
                        class="h-5 w-5 dark:invert"
                      />
                      <component :is="viewItem.icon" v-else class="text-muted-foreground h-5 w-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium">{{ viewItem.label }}</div>
                      <div class="text-muted-foreground text-xs">
                        {{ viewItem.count }} {{ viewItem.count === 1 ? 'action' : 'actions' }}
                      </div>
                    </div>
                    <LucideChevronRight class="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <!-- Category divider (shown before first item of each category) -->
                  <div
                    v-if="viewItem.type === 'node' && viewItem.category && showCategoryDivider(viewItem, filteredItems)"
                    class="text-muted-foreground mt-3 mb-1 flex items-center gap-2 px-1 text-[11px] font-medium tracking-wider uppercase first:mt-0"
                  >
                    <span>{{ viewItem.category }}</span>
                    <div class="bg-border h-px flex-1" />
                  </div>

                  <!-- Node item (leaf level — compact) -->
                  <button
                    v-if="viewItem.type === 'node'"
                    class="hover:bg-muted/50 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors"
                    draggable="true"
                    :title="viewItem.item.description"
                    @dragstart="(e) => onDragStart(e, viewItem.item)"
                    @click="onItemClick(viewItem)"
                  >
                    <component
                      :is="viewItem.logo"
                      v-if="viewItem.logo"
                      class="h-4 w-4 shrink-0 dark:invert"
                    />
                    <component
                      :is="viewItem.icon"
                      v-else
                      class="h-4 w-4 shrink-0"
                      :class="viewItem.color"
                    />
                    <span class="min-w-0 flex-1 truncate text-sm">{{ viewItem.item.label }}</span>
                  </button>
                </template>
              </div>
              <div
                v-else
                class="text-muted-foreground py-8 text-center text-sm"
              >
                No items match your search
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Push: new panel enters from right, old slides left with fade */
.panel-slide-in-enter-active,
.panel-slide-in-leave-active {
  transition: all 200ms ease;
}

.panel-slide-in-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.panel-slide-in-leave-to {
  transform: translateX(-30%);
  opacity: 0;
}

/* Pop: current panel exits to right, previous slides in from left */
.panel-slide-out-enter-active,
.panel-slide-out-leave-active {
  transition: all 200ms ease;
}

.panel-slide-out-enter-from {
  transform: translateX(-30%);
  opacity: 0;
}

.panel-slide-out-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
