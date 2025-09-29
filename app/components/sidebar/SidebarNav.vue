<script setup lang="ts"></script>

<template>
  <nav>
    <ul class="max-md:flex max-md:overflow-x-auto max-md:pb-3 md:space-y-0.5">
      <slot />
      <li class="w-full border-b md:hidden"></li>
    </ul>
  </nav>
</template>
