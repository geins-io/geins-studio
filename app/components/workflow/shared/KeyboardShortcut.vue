<script setup lang="ts">
const props = defineProps<{
  keys: string
}>()

// On Mac we render modifiers as glyphs (⇧⌥⌃⌘) matching Apple HIG; on other
// platforms we use word labels since Windows/Linux users don't share that
// visual vocabulary.
const isMac = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/.test(navigator.platform)
})

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// We use `+` as the combo separator, which collides when `+` is itself the
// key. When the combo ends with `+` (e.g. `+` alone, or `shift++`), treat
// the trailing `+` as the key and split the rest as modifiers.
const splitCombo = (str: string): string[] => {
  const lower = str.toLowerCase()
  if (lower === '+') return ['+']
  if (lower.endsWith('+')) {
    const mods = lower.slice(0, -2)
    return [...mods.split('+').map(p => p.trim()).filter(Boolean), '+']
  }
  return lower.split('+').map(p => p.trim()).filter(Boolean)
}

const parts = computed(() => {
  const raw = splitCombo(props.keys)
  const modifiers: string[] = []
  const regular: string[] = []
  for (const p of raw) {
    if (p === 'shift') modifiers.push('⇧')
    else if (p === 'alt') modifiers.push(isMac.value ? '⌥' : 'Alt')
    else if (p === 'ctrl') modifiers.push(isMac.value ? '⌃' : 'Ctrl')
    else if (p === 'meta' || p === 'cmd' || p === 'mod') modifiers.push(isMac.value ? '⌘' : 'Ctrl')
    else regular.push(p.length === 1 ? p.toUpperCase() : capitalize(p))
  }
  return [...modifiers, ...regular]
})
</script>

<template>
  <div class="flex gap-0.5">
    <!-- Pill styling mirrors the sidebar-toggle tooltip in LayoutHeader.vue
         so canvas shortcuts look like the rest of the app. `min-w` + `px-1`
         let multi-char labels (Enter, Tab) stretch beyond the square 18px
         while keeping single-char pills exactly square. -->
    <div
      v-for="(k, i) in parts" :key="i"
      class="bg-background flex h-4.5 min-w-4.5 items-center justify-center rounded-md border px-1 text-xs"
    >
      {{ k }}
    </div>
  </div>
</template>
