<script setup lang="ts">
import type { PaletteItem } from '#shared/types'
import type { Component } from 'vue'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  add: [item: PaletteItem]
}>()

const manifestStore = useWorkflowManifest()
const { actions: manifestActions, nodeTypes: manifestNodeTypes } = manifestStore

const { resolveIcon } = useLucideIcon()

const NODE_TYPE_META: Record<string, { icon: string, color: string, label: string }> = {
  action: { icon: 'Zap', color: 'text-blue-500', label: 'Actions' },
  condition: { icon: 'GitBranch', color: 'text-yellow-500', label: 'Conditions' },
  iterator: { icon: 'Repeat', color: 'text-purple-500', label: 'Iterators' },
  delay: { icon: 'Timer', color: 'text-orange-500', label: 'Delays' },
  workflow: { icon: 'Workflow', color: 'text-blue-500', label: 'Workflows' },
}

type NodeTypeGroup = {
  nodeType: string
  label: string
  icon: Component | null
  color: string
  items: PaletteItem[]
}

const nodeTypeGroups = computed<NodeTypeGroup[]>(() => {
  const groups: NodeTypeGroup[] = []

  const actionItems: PaletteItem[] = manifestActions.value.map(a => ({
    nodeType: 'action',
    id: a.name,
    label: a.displayName || a.name,
    description: a.description,
    actionName: a.name,
  }))
  if (actionItems.length) {
    const meta = NODE_TYPE_META.action!
    groups.push({ nodeType: 'action', label: meta.label, icon: resolveIcon(meta.icon), color: meta.color, items: actionItems })
  }

  for (const nt of manifestNodeTypes.value) {
    if (nt.type === 'trigger' || nt.type === 'action') continue
    const meta = NODE_TYPE_META[nt.type] ?? { icon: 'Zap', color: 'text-blue-500', label: nt.displayName || nt.type }
    groups.push({
      nodeType: nt.type,
      label: meta.label,
      icon: resolveIcon(meta.icon),
      color: meta.color,
      items: [{
        nodeType: nt.type,
        id: nt.type,
        label: nt.displayName || nt.type,
        description: nt.description,
      }],
    })
  }

  return groups
})

const searchQuery = ref('')

const filteredGroups = computed<NodeTypeGroup[]>(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return nodeTypeGroups.value
  return nodeTypeGroups.value
    .map(group => ({
      ...group,
      items: group.items.filter(
        item =>
          item.label.toLowerCase().includes(q)
          || (item.description ?? '').toLowerCase().includes(q)
          || (item.actionName ?? '').toLowerCase().includes(q),
      ),
    }))
    .filter(group => group.items.length > 0)
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
  <div
    class="bg-background overflow-hidden border-l transition-[width] duration-200 ease-in-out"
    :class="open ? 'w-80' : 'w-0 border-l-0'"
  >
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
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search nodes…"
            class="bg-background focus:ring-ring w-full rounded-md border py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:outline-none"
          />
        </div>
        <div
          v-if="manifestStore.loading.value && nodeTypeGroups.length === 0"
          class="text-muted-foreground py-8 text-center text-sm"
        >
          Loading node types…
        </div>
        <div v-else class="space-y-5">
          <div v-for="group in filteredGroups" :key="group.nodeType">
            <div class="mb-2 flex items-center gap-1.5">
              <component :is="group.icon" class="h-3.5 w-3.5" :class="group.color" />
              <span class="text-xs font-semibold tracking-wide uppercase" :class="group.color">
                {{ group.label }}
              </span>
            </div>
            <div class="space-y-1.5">
              <button
                v-for="item in group.items"
                :key="item.id"
                class="hover:bg-muted/50 flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors"
                draggable="true"
                @dragstart="(e) => onDragStart(e, item)"
                @click="onItemClick(item)"
              >
                <component :is="group.icon" class="mt-0.5 h-4 w-4 shrink-0" :class="group.color" />
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
          <div
            v-if="filteredGroups.length === 0 && !manifestStore.loading.value"
            class="text-muted-foreground py-8 text-center text-sm"
          >
            No nodes match your search
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
