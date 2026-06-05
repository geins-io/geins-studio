<script setup lang="ts">
import WorkflowHandleInput from './handle/WorkflowHandleInput.vue';
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue';

const props = defineProps<{
  data: {
    label: string;
    icon: string;
    description: string;
    config: Record<string, unknown>;
    input: Record<string, unknown>;
  };
  selected?: boolean;
}>();

const { resolveIcon } = useLucideIcon();

const IconComponent = computed(
  () => resolveIcon(props.data.icon) || resolveIcon('Repeat'),
);

const collectionDisplay = computed(() => {
  const expr = props.data.input?.collection || props.data.config?.collection;
  if (!expr) return null;
  const maxConcRaw =
    props.data.input?.maxConcurrent || props.data.config?.maxConcurrent;
  const maxConc = Number(maxConcRaw);
  if (Number.isFinite(maxConc) && maxConc > 1) return `${expr} (×${maxConc})`;
  return expr;
});
</script>

<template>
  <div
    class="bg-background min-w-[180px] rounded-lg border-2 px-4 py-3 shadow-md transition-all"
    :class="
      selected
        ? 'border-purple-500 ring-[6px] ring-purple-500/20'
        : 'border-purple-500/50'
    "
  >
    <!-- Input handle -->
    <WorkflowHandleInput
      handle-class="!border-background !h-[15px] !w-[15px] !border-2 !bg-purple-500"
    />

    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500"
      >
        <component :is="IconComponent" class="h-5 w-5" />
      </div>
      <div>
        <div
          class="text-xs font-medium tracking-wider text-purple-500 uppercase"
        >
          Iterator
        </div>
        <div class="font-semibold">{{ data.label }}</div>
      </div>
    </div>

    <!-- Collection preview -->
    <div
      v-if="collectionDisplay"
      class="text-muted-foreground bg-muted/50 mt-2 truncate rounded px-2 py-1 font-mono text-xs"
    >
      {{ collectionDisplay }}
    </div>

    <!-- Foreach output handle -->
    <WorkflowHandlePlus
      handle-id="foreach"
      :style="{ top: '30%' }"
      :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-purple-500"
    />

    <!-- Completed output handle -->
    <WorkflowHandlePlus
      handle-id="completed"
      :style="{ top: '70%' }"
      :line-length="56"
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-gray-400"
    />

    <!-- Labels for handles -->
    <div
      class="bg-background/80 absolute top-[25%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-purple-500"
    >
      Foreach
    </div>
    <div
      class="bg-background/80 absolute top-[65%] -right-1 translate-x-full rounded px-1 text-[10px] font-medium text-gray-400"
    >
      Completed
    </div>
  </div>
</template>
