<script setup lang="ts">
import { QUICK_ACCESS_SHORTCUTS } from '@/lib/dashboard';

/** Every Quick access shortcut with a checkbox; the model is the chosen ids */
const chosen = defineModel<string[]>({ required: true });

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

const options = computed(() =>
  QUICK_ACCESS_SHORTCUTS.map((s) => ({
    id: s.id,
    label: t(s.labelKey, s.labelParams ?? {}, s.labelCount ?? 1),
    iconComponent: resolveIcon(s.icon),
  })),
);

function toggle(id: string, checked: boolean) {
  chosen.value = checked
    ? [...chosen.value, id]
    : chosen.value.filter((value) => value !== id);
}
</script>

<template>
  <div class="flex flex-col">
    <label
      v-for="option in options"
      :key="option.id"
      class="flex cursor-pointer items-center gap-3 border-b py-2.5 last:border-b-0"
    >
      <Checkbox
        :model-value="chosen.includes(option.id)"
        @update:model-value="toggle(option.id, $event === true)"
      />
      <component
        :is="option.iconComponent"
        class="text-muted-foreground size-4 shrink-0"
        aria-hidden="true"
      />
      <span class="text-sm">{{ option.label }}</span>
    </label>
  </div>
</template>
