<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string;
    maxTextLength: number;
    className?: string;
    copyable?: boolean;
  }>(),
  { copyable: true },
);

const processTextLength = (text: string) => {
  if (text.length > props.maxTextLength) {
    return text.slice(0, props.maxTextLength) + '...';
  }
  return text;
};

const shortText = processTextLength(props.text);
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const copy = async (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 1500);
  }
  catch {
    // ignore clipboard failure
  }
};
</script>
<template>
  <div class="group relative flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger :class="cn(className, 'w-auto')">
          <slot>
            {{ shortText }}
          </slot>
        </TooltipTrigger>
        <TooltipContent>
          <p>{{ text }}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <button
      v-if="copyable"
      class="hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
      :title="copied ? 'Copied!' : 'Copy'"
      @click.prevent.stop="copy">
      <LucideCheck v-if="copied" class="h-3 w-3" />
      <LucideCopy v-else class="h-3 w-3" />
    </button>
  </div>
</template>
