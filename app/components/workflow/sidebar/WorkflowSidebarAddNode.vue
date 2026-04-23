<script setup lang="ts">
import type { PaletteItem, PaletteSection } from '../palette-types'

// Right-side add-node sidebar. Shows the manifest's actions + flow-control
// node types grouped by category, with a search field. Parent controls the
// open state via v-model:open and receives an `add` event when the user
// clicks an item (drag-and-drop is handled via HTML5 dataTransfer so the
// canvas's drop handler can place the node at the cursor position).
const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  add: [item: PaletteItem]
}>()

const manifestStore = useWorkflowManifest()
const { actions: manifestActions, nodeTypes: manifestNodeTypes } = manifestStore

// Structural flow-control nodes — triggers are workflow-level metadata, not nodes.
const STRUCTURAL_NODE_TYPES = new Set(['condition', 'iterator', 'delay', 'workflow'])

const paletteSections = computed<PaletteSection[]>(() => {
  const sections: PaletteSection[] = []

  const byCategory = new Map<string, PaletteItem[]>()
  for (const a of manifestActions.value) {
    const item: PaletteItem = {
      nodeType: 'action',
      id: a.name,
      label: a.displayName || a.name,
      description: a.description,
      actionName: a.name,
    }
    const list = byCategory.get(a.category)
    if (list) list.push(item)
    else byCategory.set(a.category, [item])
  }
  for (const category of [...byCategory.keys()].sort()) {
    sections.push({ category, items: byCategory.get(category)! })
  }

  const structural: PaletteItem[] = []
  for (const nt of manifestNodeTypes.value) {
    if (!STRUCTURAL_NODE_TYPES.has(nt.type)) continue
    structural.push({
      nodeType: nt.type,
      id: nt.type,
      label: nt.displayName || nt.type,
      description: nt.description,
    })
  }
  if (structural.length) sections.push({ category: 'Flow control', items: structural })

  return sections
})

const searchQuery = ref('')
const filteredSections = computed<PaletteSection[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return paletteSections.value
  return paletteSections.value
    .map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          item.label.toLowerCase().includes(q)
          || (item.description ?? '').toLowerCase().includes(q)
          || (item.actionName ?? '').toLowerCase().includes(q),
      ),
    }))
    .filter(section => section.items.length > 0)
})

const onDragStart = (event: DragEvent, item: PaletteItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'move'
  }
}

const onItemClick = (item: PaletteItem) => {
  emit('add', item)
}
</script>

<template>
  <div class="bg-background overflow-hidden border-l transition-[width] duration-200 ease-in-out"
    :class="open ? 'w-80' : 'w-0 border-l-0'">
    <div class="h-full w-80 overflow-y-auto" style="scrollbar-gutter: stable;">
      <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
        <span class="text-sm font-medium">Add node</span>
        <button class="hover:bg-accent rounded p-1.5" title="Close" @click="open = false">
          <LucideX class="h-4 w-4" />
        </button>
      </div>
      <div class="p-4">
        <div class="relative mb-3">
          <LucideSearch class="text-muted-foreground pointer-events-none absolute top-2.5 left-2 h-4 w-4" />
          <input v-model="searchQuery" type="text" placeholder="Search actions…"
            class="bg-background focus:ring-ring w-full rounded-md border py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:outline-none" />
        </div>
        <div v-if="manifestStore.loading.value && paletteSections.length === 0"
          class="text-muted-foreground py-8 text-center text-sm">
          Loading node types…
        </div>
        <div v-else class="space-y-4">
          <div v-for="section in filteredSections" :key="section.category">
            <div class="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
              {{ section.category }}
            </div>
            <div class="space-y-1.5">
              <button v-for="item in section.items" :key="item.id"
                class="hover:bg-muted/50 flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors"
                draggable="true" @dragstart="(e) => onDragStart(e, item)" @click="onItemClick(item)">
                <LucidePlay class="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">{{ item.label }}</div>
                  <div v-if="item.actionName" class="text-muted-foreground font-mono text-[10px]">
                    {{ item.actionName }}
                  </div>
                  <div v-if="item.description" class="text-muted-foreground line-clamp-2 text-xs">
                    {{ item.description }}
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div v-if="filteredSections.length === 0 && !manifestStore.loading.value"
            class="text-muted-foreground py-8 text-center text-sm">
            No nodes match your search
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
