<script setup lang="ts">
/**
 * A widget's settings: the sliders button for its header actions and the
 * narrow panel it opens. The widget owns the draft in the default slot: it
 * seeds it on `open` and stores it on `save`. Cancel or closing drops it.
 */
defineProps<{
  /** Tooltip and accessible name of the button */
  label: string;
  title: string;
  description?: string;
}>();

const emit = defineEmits<{ open: []; save: [] }>();

const open = ref(false);

function openPanel() {
  emit('open');
  open.value = true;
}

function save() {
  emit('save');
  open.value = false;
}
</script>

<template>
  <TooltipProvider :delay-duration="100">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="text-muted-foreground size-7"
          :aria-label="label"
          @click="openPanel"
        >
          <LucideSlidersHorizontal class="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{{ label }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <PanelEdit
    v-model:open="open"
    width="narrow"
    :title="title"
    :description="description"
    @save="save"
  >
    <slot />
  </PanelEdit>
</template>
