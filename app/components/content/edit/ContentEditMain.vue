<template>
  <div class="grid grid-cols-main gap-10">
    <div class="flex flex-col gap-4">
      <slot />
    </div>
    <div class="flex flex-col gap-4">
      <slot name="sidebar" />
    </div>
  </div>
</template>
