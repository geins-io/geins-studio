<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import type { DashboardWidgetInstance } from '#shared/types';
import {
  DEFAULT_QUICK_ACCESS_SHORTCUTS,
  QUICK_ACCESS_SHORTCUTS,
  quickAccessColumns,
} from '@/lib/dashboard';

const props = defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

const chosen = computed(() => {
  const ids = props.instance.config?.shortcuts;
  return Array.isArray(ids) ? ids : DEFAULT_QUICK_ACCESS_SHORTCUTS;
});

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
</script>

<template>
  <DashboardWidget :type="instance.type">
    <div
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
