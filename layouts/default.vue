<script setup lang="ts"></script>
<template>
  <div class="h-screen flex overflow-hidden">
    <LayoutSidebar class="h-full" />
    <main
      class="relative flex flex-col flex-grow overflow-x-hidden transition-[margin]"
    >
      <LayoutHeader class="h-header sticky top-0" />
      <div class="flex-grow p-8 rounded-tl-md border-l border-t overflow-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
