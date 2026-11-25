<script setup lang="ts">
/** The ✕ that takes a widget off the board while it's edited */
const emit = defineEmits<{ remove: [] }>();
</script>

<template>
  <TooltipProvider :delay-duration="100">
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="text-muted-foreground size-7"
          :aria-label="$t('remove')"
          @click="emit('remove')"
        >
          <LucideX class="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{{ $t('remove') }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
