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
</script>
<template>
  <div>
    <AuthForm
      :pending="false"
      :show-invalid="false"
      mode="reset-password"
      :token="token"
    />
  </div>
</template>
