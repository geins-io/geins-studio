<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string | null;
    type?: string;
    placeholder?: string;
    tooltip?: string;
  }>(),
  {
    type: 'text',
  },
);
</script>

<template>
  <InputGroup
    class="has-[[data-slot=input-group-control]:focus-visible]:border-border has-[[data-slot=input-group-control]:focus-visible]:ring-0"
  >
    <InputGroupInput
      :model-value="modelValue ?? ''"
      :type="type"
      :placeholder="placeholder"
      readonly
      tabindex="-1"
      class="text-muted-foreground cursor-not-allowed"
    />
    <InputGroupAddon align="inline-end">
      <TooltipProvider v-if="tooltip" :delay-duration="150">
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="flex cursor-help items-center">
              <LucideLock class="text-muted-foreground" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{{ tooltip }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <LucideLock v-else class="text-muted-foreground" />
    </InputGroupAddon>
  </InputGroup>
</template>
