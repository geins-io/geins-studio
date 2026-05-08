<script setup lang="ts">
withDefaults(
  defineProps<{
    languageId: string;
    name?: string;
    size?: 'sm' | 'md';
  }>(),
  {
    size: 'sm',
  },
);
</script>

<template>
  <span
    :class="cn('inline-flex items-center', size === 'sm' ? 'gap-2' : 'gap-2.5')"
  >
    <div
      :class="[
        flagClass(languageToCountryCode(languageId)),
        size === 'sm' ? 'size-4.5' : 'size-5',
        'rounded-full border bg-contain bg-center bg-no-repeat',
      ]"
    />
    <span v-if="name" :class="cn(size === 'sm' ? 'text-sm' : 'text-base')">{{
      name
    }}</span>
  </span>
</template>
