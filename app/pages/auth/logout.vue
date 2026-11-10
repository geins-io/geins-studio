<script lang="ts" setup>
definePageMeta({
  layout: 'auth',
});

await nextTick();

const { isAuthenticated } = useGeinsAuth();
watch(
  isAuthenticated,
  async (value) => {
    if (!value) {
      await navigateTo('/auth/login');
    }
  },
  { immediate: true },
);
</script>

<template>
  <AuthForm :loading="true" :show-invalid="false" mode="logout" />
</template>
