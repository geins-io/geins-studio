<script setup lang="ts">
const route = useRoute();
const token = String(route.query.token);

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
});

const handleSetMode = async (mode: AuthFormMode) => {
  await navigateTo('/auth/login');
};
</script>
<template>
  <div>
    <AuthForm
      :loading="false"
      :show-invalid="false"
      mode="reset-password"
      :token="token"
      @set-mode="handleSetMode"
    />
  </div>
</template>
