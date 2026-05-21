<script setup lang="ts">
withDefaults(
  defineProps<{
    countryCode: string;
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
    v-if="name"
    :class="cn('inline-flex items-center', size === 'sm' ? 'gap-2' : 'gap-2.5')"
  >
    <div
      :class="[
        flagClass(countryCode),
        size === 'sm' ? 'size-4.5' : 'size-5',
        'rounded-full border bg-contain bg-center bg-no-repeat',
      ]"
    />
    <span :class="cn(size === 'sm' ? 'text-sm' : 'text-base')">{{ name }}</span>
  </span>
  <div
    v-else
    :class="[
      flagClass(countryCode),
      size === 'sm' ? 'size-4.5' : 'size-5',
      'rounded-full border bg-contain bg-center bg-no-repeat',
    ]"
  />
</template>
