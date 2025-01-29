<script lang="ts" setup>
definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
});
</script>

<template>
  <div class="grid gap-2 text-center">
    <h1 class="mb-3 text-3xl font-bold">Logging out..</h1>
    <div
      class="relative flex items-center justify-center text-muted-foreground"
    >
      <LucideLoaderCircle class="size-10 animate-spin" />
    </div>
  </div>
</template>
