<script setup lang="ts">
import type {
  DashboardWidgetInstance,
  DashboardWidgetType,
} from '#shared/types';
import { DASHBOARD_WIDGET_GROUPS, DASHBOARD_WIDGETS } from '@/lib/dashboard';

/**
 * The Add widget panel: every widget in the registry, grouped and searchable
 * by title. + adds a widget at the bottom of the board (`add`). A row can also
 * be dragged onto the board: while it is, the panel slides out of the way and
 * `dragType` holds the widget's type, for the board to place it.
 */
const props = defineProps<{
  /** The widgets on the board, for "N on board" */
  items: DashboardWidgetInstance[];
}>();

const emit = defineEmits<{ add: [type: DashboardWidgetType] }>();

const open = defineModel<boolean>('open', { default: false });
const dragType = defineModel<DashboardWidgetType | null>('dragType', {
  default: null,
});

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

const query = ref('');
watch(open, (isOpen) => {
  if (isOpen) query.value = '';
});

const counts = computed(() => {
  const counts = new Map<DashboardWidgetType, number>();
  for (const item of props.items) {
    counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  }
  return counts;
});

// Groups in panel order; a group with no (matching) widgets is left out
const groups = computed(() => {
  const q = query.value.trim().toLocaleLowerCase();
  const widgets = Object.values(DASHBOARD_WIDGETS).filter(
    (widget) => !q || t(widget.titleKey).toLocaleLowerCase().includes(q),
  );
  return DASHBOARD_WIDGET_GROUPS.map((group) => ({
    group,
    widgets: widgets.filter((widget) => widget.group === group),
  })).filter(({ widgets }) => widgets.length);
});

// The board reads the type from `dragType`; Firefox only starts a drag that
// carries some data
const DRAG_FORMAT = 'application/x-geins-dashboard-widget';
let dragging = false;

function onDragStart(event: DragEvent, type: DashboardWidgetType) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData(DRAG_FORMAT, type);
  event.dataTransfer.effectAllowed = 'copy';
  dragging = true;
  // Moving the dragged row away in the same task cancels the drag in Chrome
  setTimeout(() => {
    if (dragging) dragType.value = type;
  });
}

function onDragEnd() {
  dragging = false;
  dragType.value = null;
}
</script>

<template>
  <Sheet v-model:open="open">
    <!-- While a row is dragged the panel stays open (it holds the drag) but
         slides off-screen, and the overlay clears, so the board is visible -->
    <SheetContent
      :class="cn('w-[96vw] max-w-[420px]', dragType && 'translate-x-full')"
      :overlay-class="cn('transition-opacity', dragType && 'opacity-0')"
    >
      <SheetHeader>
        <SheetTitle>{{ $t('add_entity', { entityKey: 'widget' }) }}</SheetTitle>
      </SheetHeader>
      <div class="border-b p-4">
        <div class="relative">
          <Input
            v-model="query"
            class="pl-8"
            :placeholder="$t('search_entity', { entityKey: 'widget' }, 2)"
            :aria-label="$t('search_entity', { entityKey: 'widget' }, 2)"
          />
          <span
            class="absolute inset-y-0 start-0 flex items-center justify-center px-3"
          >
            <LucideSearch class="text-foreground size-4" aria-hidden="true" />
          </span>
        </div>
        <SheetDescription class="mt-2 text-xs">
          {{ $t('dashboards.add_widget_hint') }}
        </SheetDescription>
      </div>
      <SheetBody class="min-h-0 flex-1 p-4 sm:p-4">
        <TooltipProvider :delay-duration="100">
          <section
            v-for="{ group, widgets } in groups"
            :key="group"
            class="mb-5 last:mb-0"
          >
            <h3
              class="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase"
            >
              {{ $t(`dashboards.groups.${group}`) }}
            </h3>
            <ul class="flex flex-col gap-1.5">
              <li
                v-for="widget in widgets"
                :key="widget.type"
                draggable="true"
                class="group bg-card hover:bg-muted/50 hover:border-muted-foreground/40 flex cursor-grab items-center gap-3 rounded-md border px-3 py-2.5 transition-colors active:cursor-grabbing"
                @dragstart="onDragStart($event, widget.type)"
                @dragend="onDragEnd"
              >
                <LucideGripVertical
                  class="text-muted-foreground/50 group-hover:text-muted-foreground -ml-1 size-4 shrink-0"
                  aria-hidden="true"
                />
                <div
                  class="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md"
                >
                  <component
                    :is="resolveIcon(widget.icon)"
                    class="text-muted-foreground size-4"
                    aria-hidden="true"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium">{{ $t(widget.titleKey) }}</p>
                  <p class="text-muted-foreground truncate text-xs">
                    {{ $t(widget.descriptionKey) }}
                  </p>
                </div>
                <span
                  v-if="counts.get(widget.type)"
                  class="text-muted-foreground text-[11px] whitespace-nowrap"
                >
                  {{
                    $t('dashboards.on_board', {
                      count: counts.get(widget.type),
                    })
                  }}
                </span>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground size-7 shrink-0"
                      :aria-label="
                        $t('add_entity', { entityKey: widget.titleKey })
                      "
                      @click="emit('add', widget.type)"
                    >
                      <LucidePlus class="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {{ $t('dashboards.add_at_bottom') }}
                  </TooltipContent>
                </Tooltip>
              </li>
            </ul>
          </section>
        </TooltipProvider>
        <Empty v-if="!groups.length">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideSearchX class="size-5" />
            </EmptyMedia>
            <EmptyTitle>
              {{ $t('no_entity_found', { entityKey: 'widget' }, 2) }}
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      </SheetBody>
    </SheetContent>
  </Sheet>
</template>
