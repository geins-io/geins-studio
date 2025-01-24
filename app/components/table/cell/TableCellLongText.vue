<script setup lang="ts">
const props = defineProps<{
  text: string;
  maxTextLength: number;
  className?: string;
}>();

const processTextLength = (text: string) => {
  if (text.length > props.maxTextLength) {
    return text.slice(0, props.maxTextLength) + '...';
  }
  return text;
};

const shortText = processTextLength(props.text);
</script>
<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger :class="className">
        <slot>
          {{ shortText }}
        </slot>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ text }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
