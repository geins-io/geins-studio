<script setup lang="ts">
import WorkflowHandleInput from './handle/WorkflowHandleInput.vue';
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue';
import type { Component } from 'vue';
import MonitorSymbol from '~/assets/logos/kits/monitor.svg';
import LitiumSymbol from '~/assets/logos/litium-symbol.svg';

const PROVIDER_LOGOS: Record<string, Component | string> = {
  litium: LitiumSymbol,
  monitor: MonitorSymbol,
  'monitor-erp': MonitorSymbol,
};

const props = defineProps<{
  data: {
    label: string;
    icon?: string;
    description?: string;
    functionName?: string;
    config: Record<string, unknown>;
  };
  selected?: boolean;
}>();

const { resolveIcon } = useLucideIcon();

const manifestStore = useWorkflowManifest();
const { providersByName } = manifestStore;

const node = computed(() => manifestStore.getNode(props.data.functionName));

const providerKey = computed(() => node.value?.provider ?? '');

const actionDisplayName = computed(() => node.value?.displayName ?? '');

const providerLogo = computed<Component | string | null>(
  () => PROVIDER_LOGOS[providerKey.value] ?? null,
);
const IconComponent = computed(() => {
  // Prefer the node's own icon, then the provider's icon, then a fallback.
  if (node.value?.icon) return resolveIcon(node.value.icon);
  const providerIcon = providersByName.value.get(providerKey.value)?.icon;
  return resolveIcon(providerIcon ?? '') || resolveIcon('Zap');
});
</script>

<template>
  <div
    class="bg-background flex min-h-[100px] min-w-[180px] items-center rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="
      selected
        ? 'border-blue-500 ring-[6px] ring-blue-500/20'
        : 'border-blue-500/50'
    "
  >
    <!-- Input handle -->
    <WorkflowHandleInput
      handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-blue-500"
    />

    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500"
      >
        <component
          :is="providerLogo"
          v-if="providerLogo"
          class="size-5 dark:invert"
          :font-controlled="false"
        />
        <component :is="IconComponent" v-else class="size-5" />
      </div>
      <div>
        <div class="text-xs font-medium tracking-wider text-blue-500 uppercase">
          {{ $t('node.types.action') }}
        </div>
        <div class="font-semibold">{{ data.label }}</div>
        <div
          v-if="actionDisplayName"
          class="text-muted-foreground truncate text-xs leading-tight"
        >
          {{ actionDisplayName }}
        </div>
      </div>
    </div>

    <!-- Output handle -->
    <WorkflowHandlePlus
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-blue-500"
    />
  </div>
</template>
