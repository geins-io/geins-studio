<script setup lang="ts">
/**
 * App loading indicator — the same 4×4 dot-grid "gemini-pulse" animation the SPA
 * boot screen uses ({@link app-skeleton.html}), as a reusable component with a
 * configurable message. Use for in-flight states (e.g. the upload wizard's
 * "uploading…" step). Colour follows the current text colour, so wrap it in a
 * `text-*` context to tint (defaults to `text-foreground`).
 */
defineProps<{ text?: string }>();
</script>

<template>
  <div class="text-foreground flex flex-col items-center gap-6">
    <div class="loader" role="status" aria-live="polite">
      <span v-for="i in 16" :key="i" />
    </div>
    <p v-if="text" class="text-foreground/70 text-sm">{{ text }}</p>
  </div>
</template>

<style scoped>
/* 4×4 grid of 9px dots with 3px gaps. */
.loader {
  display: grid;
  grid-template-columns: repeat(4, 9px);
  grid-template-rows: repeat(4, 9px);
  gap: 3px;
}
.loader span {
  background: currentColor;
  border-radius: 1.5px;
  opacity: 0;
  transform: scale(0.4);
  animation: gemini-pulse 2s ease-in-out infinite;
}

/* Diagonal wave: (row + col) * 0.1s delay. */
.loader span:nth-child(1) {
  animation-delay: 0s;
}
.loader span:nth-child(2) {
  animation-delay: 0.1s;
}
.loader span:nth-child(3) {
  animation-delay: 0.2s;
}
.loader span:nth-child(4) {
  animation-delay: 0.3s;
}
.loader span:nth-child(5) {
  animation-delay: 0.1s;
}
.loader span:nth-child(6) {
  animation-delay: 0.2s;
}
.loader span:nth-child(7) {
  animation-delay: 0.3s;
}
.loader span:nth-child(8) {
  animation-delay: 0.4s;
}
.loader span:nth-child(9) {
  animation-delay: 0.2s;
}
.loader span:nth-child(10) {
  animation-delay: 0.3s;
}
.loader span:nth-child(11) {
  animation-delay: 0.4s;
}
.loader span:nth-child(12) {
  animation-delay: 0.5s;
}
.loader span:nth-child(13) {
  animation-delay: 0.3s;
}
.loader span:nth-child(14) {
  animation-delay: 0.4s;
}
.loader span:nth-child(15) {
  animation-delay: 0.5s;
}
.loader span:nth-child(16) {
  animation-delay: 0.6s;
}

@keyframes gemini-pulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.4);
  }
  25%,
  55% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
