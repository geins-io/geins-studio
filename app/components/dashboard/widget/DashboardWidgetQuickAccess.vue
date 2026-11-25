<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import type { DashboardWidgetInstance } from '#shared/types';
import {
  DASHBOARD_BOARD_CONTEXT,
  QUICK_ACCESS_SHORTCUTS,
  quickAccessColumns,
  quickAccessShortcutIds,
} from '@/lib/dashboard';

const props = defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const board = inject(DASHBOARD_BOARD_CONTEXT, null);

const chosen = computed(() => quickAccessShortcutIds(props.instance.config));

const shortcuts = computed(() =>
  QUICK_ACCESS_SHORTCUTS.filter((s) => chosen.value.includes(s.id)).map(
    (s) => ({
      ...s,
      label: t(s.labelKey, s.labelParams ?? {}, s.labelCount ?? 1),
      iconComponent: resolveIcon(s.icon),
    }),
  ),
);

const gridEl = useTemplateRef<HTMLElement>('grid');
const { width } = useElementSize(gridEl);
const columns = computed(() =>
  quickAccessColumns(width.value, shortcuts.value.length),
);

const draft = ref<string[]>([]);

// Saving the shortcuts already shown would store a board the user never
// changed, so they'd stop getting the default as it grows
function save() {
  const next = quickAccessShortcutIds({ shortcuts: draft.value });
  if (next.join() === chosen.value.join()) return;
  board?.updateConfig(props.instance.i, {
    ...props.instance.config,
    shortcuts: next,
  });
}
</script>

<template>
  <DashboardWidget :instance="instance">
    <template #actions>
      <DashboardWidgetSettings
        :label="t('dashboards.widgets.quick_access.choose')"
        :title="t('dashboards.widgets.quick_access.title')"
        :description="t('dashboards.widgets.quick_access.choose_description')"
        @open="draft = [...chosen]"
        @save="save"
      >
        <DashboardWidgetQuickAccessPicker v-model="draft" />
      </DashboardWidgetSettings>
    </template>
    <p v-if="!shortcuts.length" class="text-muted-foreground text-sm">
      {{ t('dashboards.widgets.quick_access.empty') }}
    </p>
    <div
      v-else
      ref="grid"
      class="grid gap-2"
      :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
    >
      <NuxtLink
        v-for="shortcut in shortcuts"
        :key="shortcut.id"
        :to="shortcut.href"
        class="bg-background hover:border-foreground/30 flex h-[38px] min-w-0 items-center gap-2 rounded-md border px-3 transition-colors"
      >
        <component
          :is="shortcut.iconComponent"
          class="text-muted-foreground size-4 shrink-0"
          aria-hidden="true"
        />
        <span class="truncate text-xs font-medium">{{ shortcut.label }}</span>
      </NuxtLink>
    </div>
  </DashboardWidget>
</template>
