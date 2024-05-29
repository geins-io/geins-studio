<script setup lang="ts"></script>
<template>
  <div class="h-screen flex flex-col">
    <LayoutHeader class="w-full fixed top-0 h-[--header-height]" />
    <div class="flex flex-grow mt-[--header-height]">
      <LayoutSidebar class="w-56 h-full" />
      <div class="flex-grow p-8 rounded-md border-l border-t overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
