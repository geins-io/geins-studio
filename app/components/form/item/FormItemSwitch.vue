<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    disabled?: boolean;
  }>(),
  {
    label: '',
    description: '',
    disabled: false,
  },
);
const modelValue = defineModel<boolean>();
</script>
<template>
  <FormItem
    class="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 text-sm"
  >
    <div class="text-left">
      <FormLabel class="text-sm font-semibold">{{ label }}</FormLabel>
      <FormDescription class="mt-1 text-xs text-muted-foreground">
        {{ description }}
      </FormDescription>
    </div>
    <FormControl>
      <Switch
        v-model="modelValue"
        :disabled="disabled"
        :aria-readonly="disabled"
      />
    </FormControl>
  </FormItem>
</template>
