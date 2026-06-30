<script setup lang="ts">
import type { NodeTemplate, PaletteItem, ManifestNode } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import WorkflowNodeSaveTemplateDialog from '../node/WorkflowNodeSaveTemplateDialog.vue';
import type { Component } from 'vue';
import MonitorSymbol from '~/assets/logos/kits/monitor.svg';
import LitiumSymbol from '~/assets/logos/litium-symbol.svg';

// ─── Props / emits ─────────────────────────────────────────────────
const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  add: [item: PaletteItem];
}>();

// ─── Node templates ───────────────────────────────────────────────
const nodeTemplates = useNodeTemplates();
const { toast } = useToast();
const { t } = useI18n();
const confirmDeleteId = ref<string | null>(null);
const editingTemplate = ref<NodeTemplate | null>(null);
const showEditDialog = ref(false);

// ─── Manifest data ─────────────────────────────────────────────────
const manifestStore = useWorkflowManifest();
const {
  nodes: manifestNodes,
  nodeCategories,
  nodesByCategory,
  categoryByName,
  providersByName,
} = manifestStore;

const { resolveIcon } = useLucideIcon();

const CATEGORY_FALLBACK_ICON = 'Zap';
const NODE_COLOR = 'text-blue-500';

/** Icon used for saved templates, keyed by canvas kind. */
const KIND_ICON: Record<string, string> = {
  action: 'Globe',
  condition: 'GitBranch',
  iterator: 'Repeat',
  paginator: 'Layers',
  delay: 'Timer',
  workflow: 'Workflow',
  trigger: 'Zap',
};

/** Build a PaletteItem from a manifest node descriptor. */
function nodeToPaletteItem(node: ManifestNode): PaletteItem {
  return {
    kind: functionNameToNodeKind(node.functionName),
    id: node.functionName,
    label: node.displayName || node.name,
    description: node.description,
    functionName: node.functionName,
  };
}

// ─── Provider branding ─────────────────────────────────────────────
const PROVIDER_LOGOS: Record<string, unknown> = {
  litium: LitiumSymbol,
  monitor: MonitorSymbol,
  'monitor-erp': MonitorSymbol,
};

function toComponentOrNull(value: unknown): Component | null {
  if (!value) return null;
  if (typeof value === 'object' || typeof value === 'function') {
    return value as Component;
  }
  return null;
}

function getProviderLogo(providerKey: string): Component | null {
  return toComponentOrNull(PROVIDER_LOGOS[providerKey]);
}

function getProviderDisplayName(providerKey: string): string {
  return providersByName.value.get(providerKey)?.displayName ?? providerKey;
}

// ─── Category helpers (icon/displayName from the manifest descriptor) ─
function getCategoryIcon(name: string): Component | null {
  const icon = categoryByName.value.get(name)?.icon;
  return resolveIcon(icon ?? CATEGORY_FALLBACK_ICON);
}

function getKindIcon(kind: string): Component | null {
  return resolveIcon(KIND_ICON[kind] ?? 'Bookmark');
}

// ─── View stack types ──────────────────────────────────────────────
// Items renderable at any panel level.
type CategoryViewItem = {
  type: 'category';
  key: string;
  label: string;
  icon: Component | null;
  color: string;
  count: number;
};

type NodeViewItem = {
  type: 'node';
  item: PaletteItem;
  icon: Component | null;
  logo?: Component | null;
  color: string;
  // Provider display name — used to render a divider within a category panel.
  category?: string;
};

type ViewItem = CategoryViewItem | NodeViewItem;

interface ViewStack {
  id: string;
  title: string;
  icon?: Component | null;
  logo?: Component | null;
  color?: string;
  items: ViewItem[];
  hasSearch: boolean;
  search: string;
}

// ─── View stack state ──────────────────────────────────────────────
const viewStacks = ref<ViewStack[]>([]);
const transitionDirection = ref<'in' | 'out'>('in');

const activeStack = computed<ViewStack | null>(() =>
  viewStacks.value.length > 0
    ? viewStacks.value[viewStacks.value.length - 1]!
    : null,
);

const canGoBack = computed(() => viewStacks.value.length > 1);

function pushStack(stack: Omit<ViewStack, 'id' | 'search'>) {
  transitionDirection.value = 'in';
  viewStacks.value.push({
    ...stack,
    id: `${stack.title}-${Date.now()}`,
    search: '',
  });
}

function popStack() {
  if (viewStacks.value.length > 1) {
    transitionDirection.value = 'out';
    viewStacks.value.pop();
  }
}

function _resetStacks() {
  viewStacks.value = [];
  buildRootStack();
}

// ─── Build the root categories panel ───────────────────────────────
function buildRootStack() {
  const items: ViewItem[] = [];

  // My Templates — only shown when templates exist
  if (nodeTemplates.templateCount.value > 0) {
    items.push({
      type: 'category',
      key: 'templates',
      label: t('node.templates.title'),
      icon: resolveIcon('Bookmark'),
      color: 'text-amber-500',
      count: nodeTemplates.templateCount.value,
    });
  }

  // One card per node category (network/flow/state/event/data-transformation).
  for (const cat of nodeCategories.value) {
    const count = (nodesByCategory.value.get(cat.name) ?? []).length;
    if (!count) continue;
    items.push({
      type: 'category',
      key: cat.name,
      label: cat.displayName || cat.name,
      icon: getCategoryIcon(cat.name),
      color: NODE_COLOR,
      count,
    });
  }

  pushStack({
    title: t('node.add'),
    items,
    hasSearch: true,
  });
}

// ─── Build a category's nodes panel ────────────────────────────────
function buildCategoryStack(
  categoryName: string,
  label: string,
  icon: Component | null,
) {
  const catNodes = nodesByCategory.value.get(categoryName) ?? [];
  // When a category spans multiple providers, group nodes under provider
  // dividers; otherwise show a flat list.
  const multiProvider = new Set(catNodes.map((n) => n.provider)).size > 1;

  const sorted = [...catNodes].sort((a, b) => {
    const p = a.provider.localeCompare(b.provider);
    if (p !== 0) return p;
    return (a.displayName || a.name).localeCompare(b.displayName || b.name);
  });

  const items: NodeViewItem[] = sorted.map((n) => ({
    type: 'node' as const,
    item: nodeToPaletteItem(n),
    icon: n.icon ? resolveIcon(n.icon) : icon,
    logo: getProviderLogo(n.provider),
    color: NODE_COLOR,
    category: multiProvider ? getProviderDisplayName(n.provider) : undefined,
  }));

  pushStack({
    title: label,
    icon,
    items,
    hasSearch: true,
  });
}

// ─── Build the templates panel ────────────────────────────────────
function buildTemplatesStack() {
  const items: NodeViewItem[] = nodeTemplates.templates.value.map((tpl) => ({
    type: 'node' as const,
    item: nodeTemplates.toPaletteItem(tpl),
    icon: getKindIcon(tpl.kind),
    color: 'text-amber-500',
  }));

  pushStack({
    title: t('node.templates.title'),
    icon: resolveIcon('Bookmark'),
    color: 'text-amber-500',
    items,
    hasSearch: true,
  });
}

function refreshTemplatesStack() {
  const stack = activeStack.value;
  if (!stack || stack.title !== t('node.templates.title')) return;
  const items: NodeViewItem[] = nodeTemplates.templates.value.map((tpl) => ({
    type: 'node' as const,
    item: nodeTemplates.toPaletteItem(tpl),
    icon: getKindIcon(tpl.kind),
    color: 'text-amber-500',
  }));
  stack.items = items;
}

function onDeleteTemplate(id: string) {
  nodeTemplates.deleteTemplate(id);
  confirmDeleteId.value = null;
  toast({ title: t('node.templates.deleted') });
  if (nodeTemplates.templateCount.value === 0 && viewStacks.value.length > 1) {
    popStack();
  } else {
    refreshTemplatesStack();
  }
}

function onEditTemplate(template: NodeTemplate) {
  editingTemplate.value = template;
  showEditDialog.value = true;
}

function onEditTemplateSave(payload: { name: string; description?: string }) {
  if (!editingTemplate.value) return;
  nodeTemplates.updateTemplate(editingTemplate.value.id, {
    name: payload.name,
    description: payload.description,
  });
  editingTemplate.value = null;
  toast({ title: t('node.templates.updated') });
  refreshTemplatesStack();
}

// ─── Item click handler ────────────────────────────────────────────
function onItemClick(viewItem: ViewItem) {
  if (viewItem.type === 'category') {
    if (viewItem.key === 'templates') {
      buildTemplatesStack();
    } else {
      buildCategoryStack(viewItem.key, viewItem.label, viewItem.icon);
    }
  } else if (viewItem.type === 'node') {
    emit('add', viewItem.item);
  }
}

// ─── Drag support (leaf nodes only) ────────────────────────────────
function onDragStart(event: DragEvent, item: PaletteItem) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'move';
  }
}

// ─── Search filtering ──────────────────────────────────────────────
const filteredItems = computed<ViewItem[]>(() => {
  const stack = activeStack.value;
  if (!stack) return [];

  const q = stack.search.trim().toLowerCase();
  if (!q) return stack.items;

  return stack.items.filter((item) => {
    if (item.type === 'category') {
      return item.label.toLowerCase().includes(q);
    }
    if (item.type === 'node') {
      return (
        item.item.label.toLowerCase().includes(q) ||
        (item.item.description ?? '').toLowerCase().includes(q) ||
        (item.item.functionName ?? '').toLowerCase().includes(q)
      );
    }
    return false;
  });
});

// ─── Category divider helper ───────────────────────────────────────
function showCategoryDivider(item: NodeViewItem, items: ViewItem[]): boolean {
  if (!item.category) return false;
  const idx = items.indexOf(item);
  if (idx <= 0) return true;
  const prev = items[idx - 1];
  if (prev?.type !== 'node') return true;
  return prev.category !== item.category;
}

// ─── Global search (from root level, search across all nodes) ──────
const globalSearchResults = computed<NodeViewItem[]>(() => {
  const stack = activeStack.value;
  if (!stack || viewStacks.value.length !== 1) return [];

  const q = stack.search.trim().toLowerCase();
  if (!q) return [];

  return manifestNodes.value
    .filter(
      (n) =>
        (n.displayName || n.name).toLowerCase().includes(q) ||
        (n.description ?? '').toLowerCase().includes(q) ||
        n.name.toLowerCase().includes(q) ||
        n.functionName.toLowerCase().includes(q),
    )
    .map((n) => ({
      type: 'node' as const,
      item: nodeToPaletteItem(n),
      icon: n.icon ? resolveIcon(n.icon) : resolveIcon('Zap'),
      logo: getProviderLogo(n.provider),
      color: NODE_COLOR,
    }));
});

const isGlobalSearch = computed(() => {
  const stack = activeStack.value;
  return (
    stack && viewStacks.value.length === 1 && stack.search.trim().length > 0
  );
});

const globalTemplateResults = computed<NodeViewItem[]>(() => {
  const stack = activeStack.value;
  if (!stack || viewStacks.value.length !== 1) return [];

  const q = stack.search.trim().toLowerCase();
  if (!q) return [];

  return nodeTemplates.templates.value
    .filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(q) ||
        (tpl.description ?? '').toLowerCase().includes(q) ||
        (tpl.functionName ?? '').toLowerCase().includes(q),
    )
    .map((tpl) => ({
      type: 'node' as const,
      item: nodeTemplates.toPaletteItem(tpl),
      icon: getKindIcon(tpl.kind),
      color: 'text-amber-500',
    }));
});

const allGlobalResults = computed<NodeViewItem[]>(() => [
  ...globalTemplateResults.value,
  ...globalSearchResults.value,
]);

// ─── Init stack on open ────────────────────────────────────────────
watch(open, (isOpen) => {
  if (isOpen && viewStacks.value.length === 0) {
    buildRootStack();
  }
  if (!isOpen) {
    // Reset when closed so re-opening starts fresh
    viewStacks.value = [];
  }
});

// Build initial stack if already open
onMounted(() => {
  if (open.value && viewStacks.value.length === 0) {
    buildRootStack();
  }
});

function onSearchInput(value: string) {
  if (activeStack.value) {
    activeStack.value.search = value;
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
        {{ $t('node.loading') }}
      </div>

      <!-- Panel transition container -->
      <Transition
        v-else-if="activeStack"
        :name="`panel-slide-${transitionDirection}`"
        mode="out-in"
      >
        <div :key="activeStack.id" class="absolute inset-0 flex flex-col">
          <!-- Panel header -->
          <div class="flex items-center gap-2 border-b px-4 py-3">
            <button
              v-if="canGoBack"
              class="hover:bg-accent -ml-1 rounded p-1"
              :title="$t('node.back')"
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
            <button
              class="hover:bg-accent rounded p-1.5"
              :title="$t('close')"
              @click="open = false"
            >
              <LucideX class="h-4 w-4" />
            </button>
          </div>

          <!-- Search bar -->
          <div v-if="activeStack.hasSearch" class="border-b px-4 py-2">
            <div class="relative">
              <LucideSearch
                class="text-muted-foreground pointer-events-none absolute top-2 left-2 h-4 w-4"
              />
              <input
                :value="activeStack.search"
                type="text"
                :placeholder="$t('node.search_placeholder')"
                class="bg-background focus:ring-ring w-full rounded-md border py-1.5 pr-2 pl-8 text-sm focus:ring-2 focus:outline-none"
                @input="
                  onSearchInput(($event.target as HTMLInputElement).value)
                "
              />
            </div>
          </div>

          <!-- Panel content -->
          <div
            class="flex-1 overflow-y-auto p-3"
            style="scrollbar-gutter: stable"
          >
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
                    class="mt-0.5 size-4 shrink-0 dark:invert"
                    :font-controlled="false"
                  />
                  <component
                    :is="viewItem.icon"
                    v-else
                    class="mt-0.5 size-4 shrink-0"
                    :class="viewItem.color"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium">
                      {{ viewItem.item.label }}
                    </div>
                    <div
                      v-if="viewItem.item.functionName"
                      class="text-muted-foreground font-mono text-[10px]"
                    >
                      {{ viewItem.item.functionName }}
                    </div>
                    <div
                      v-if="viewItem.item.description"
                      class="text-muted-foreground line-clamp-2 text-xs"
                    >
                      {{ viewItem.item.description }}
                    </div>
                  </div>
                </button>
              </div>
              <div
                v-else
                class="text-muted-foreground py-8 text-center text-sm"
              >
                {{ $t('node.no_results') }}
              </div>
            </template>

            <!-- Normal panel items -->
            <template v-else>
              <div v-if="filteredItems.length > 0" class="space-y-1">
                <template
                  v-for="viewItem in filteredItems"
                  :key="
                    viewItem.type === 'node' ? viewItem.item.id : viewItem.key
                  "
                >
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
                      <div class="text-sm font-medium">
                        {{ viewItem.label }}
                      </div>
                      <div class="text-muted-foreground text-xs">
                        {{ $t('node.node_count', viewItem.count) }}
                      </div>
                    </div>
                    <LucideChevronRight
                      class="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    />
                  </button>

                  <!-- Category divider (shown before first item of each provider group) -->
                  <div
                    v-if="
                      viewItem.type === 'node' &&
                      viewItem.category &&
                      showCategoryDivider(viewItem, filteredItems)
                    "
                    class="text-muted-foreground mt-3 mb-1 flex items-center gap-2 px-1 text-[11px] font-medium tracking-wider uppercase first:mt-0"
                  >
                    <span>{{ viewItem.category }}</span>
                    <div class="bg-border h-px flex-1" />
                  </div>

                  <!-- Node item (leaf level — compact) -->
                  <div
                    v-if="viewItem.type === 'node'"
                    class="hover:bg-muted/50 group/node flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors"
                  >
                    <!-- Delete confirmation overlay -->
                    <template
                      v-if="
                        viewItem.item.templateId &&
                        confirmDeleteId === viewItem.item.templateId
                      "
                    >
                      <div
                        class="flex w-full items-center justify-between gap-2"
                      >
                        <span class="text-destructive text-xs">
                          {{ $t('node.templates.delete_confirm') }}
                        </span>
                        <div class="flex gap-1">
                          <button
                            class="bg-destructive text-destructive-foreground rounded px-2 py-0.5 text-xs"
                            @click.stop="
                              onDeleteTemplate(viewItem.item.templateId!)
                            "
                          >
                            {{ $t('delete') }}
                          </button>
                          <button
                            class="bg-muted rounded px-2 py-0.5 text-xs"
                            @click.stop="confirmDeleteId = null"
                          >
                            {{ $t('cancel') }}
                          </button>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <button
                        class="flex min-w-0 flex-1 items-center gap-2.5"
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
                        <span class="min-w-0 flex-1 truncate text-left text-sm">
                          {{ viewItem.item.label }}
                        </span>
                      </button>
                      <!-- Template management buttons -->
                      <div
                        v-if="viewItem.item.templateId"
                        class="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/node:opacity-100"
                      >
                        <button
                          class="text-muted-foreground hover:text-foreground rounded p-1"
                          :title="$t('node.templates.edit')"
                          @click.stop="
                            onEditTemplate(
                              nodeTemplates.getTemplate(
                                viewItem.item.templateId!,
                              )!,
                            )
                          "
                        >
                          <LucidePencil class="h-3 w-3" />
                        </button>
                        <button
                          class="text-muted-foreground hover:text-destructive rounded p-1"
                          :title="$t('node.templates.delete')"
                          @click.stop="
                            confirmDeleteId = viewItem.item.templateId!
                          "
                        >
                          <LucideTrash2 class="h-3 w-3" />
                        </button>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
              <div
                v-else
                class="text-muted-foreground py-8 text-center text-sm"
              >
                {{ $t('node.no_items_match') }}
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Edit template dialog -->
    <WorkflowNodeSaveTemplateDialog
      :open="showEditDialog"
      :default-name="editingTemplate?.name ?? ''"
      :default-description="editingTemplate?.description"
      @update:open="showEditDialog = $event"
      @save="onEditTemplateSave"
    />
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
