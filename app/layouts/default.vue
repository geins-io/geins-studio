<script setup lang="ts"></script>
<template>
  <div class="flex h-screen overflow-hidden">
    <LayoutSidebar class="h-full shrink-0" />
    <main class="relative flex grow flex-col transition-[margin]">
      <LayoutHeader class="sticky top-0 h-header" />
      <div
        class="grow overflow-auto overflow-x-hidden rounded-tl-lg border-l border-t p-8"
      >
        <slot />
      </div>
    </main>
  </div>
</template>
