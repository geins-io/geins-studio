<script setup lang="ts">
/**
 * Consistent data-type badge used across the workflow editor.
 *
 * Props:
 *  - type:    The raw type string (e.g. "string", "number", "boolean", "object", "array", "json", "secret")
 *  - display: "short" renders a compact symbolic badge (abc, 123, 0/1, …)
 *             "long"  renders the full type name inside the badge
 *
 * The color palette is shared so every occurrence looks identical regardless
 * of which parent component renders it.
 */

const props = withDefaults(
  defineProps<{
    type: string
    display?: 'short' | 'long'
  }>(),
  { display: 'short' },
)

interface TypeMeta {
  label: string
  class: string
}

const TYPE_MAP: Record<string, TypeMeta> = {
  string:  { label: 'abc', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  number:  { label: '123', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  integer: { label: '123', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  int:     { label: '123', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  bool:    { label: '0/1', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  boolean: { label: '0/1', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  object:  { label: '{ }', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  json:    { label: '{ }', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  array:   { label: '[ ]', class: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  secret:  { label: '***', class: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  date:    { label: '📅',  class: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
}

const FALLBACK: TypeMeta = TYPE_MAP.string!

const meta = computed(() => TYPE_MAP[props.type.toLowerCase()] ?? FALLBACK)
const displayText = computed(() =>
  props.display === 'long' ? props.type : meta.value.label,
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded font-mono font-medium leading-none"
    :class="[
      meta.class,
      display === 'short'
        ? 'px-1 py-0.5 text-[9px]'
        : 'px-1.5 py-0.5 text-[10px]',
    ]"
  >{{ displayText }}</span>
</template>
