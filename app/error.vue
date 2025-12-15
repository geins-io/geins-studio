<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps({
  error: Object as () => NuxtError,
});

const config = useRuntimeConfig();
const isDevelopment = config.public.NODE_ENV === 'development';

// Determine which error component to show based on status code
const is404 = computed(() => props.error?.statusCode === 404);
const is500 = computed(
  () =>
    props.error?.statusCode === 500 ||
    (props.error?.statusCode && props.error.statusCode >= 500),
);

// Get appropriate error message based on status code
const errorMessage = computed(() => {
  if (props.error?.message) return props.error.message;

  if (is404.value) {
    return 'The page you are looking for does not exist';
  }
  if (is500.value) {
    return 'An unexpected server error occurred. Please try again later.';
  }
  return 'An unexpected error occurred';
});

const clearAndRedirect = async () => {
  clearError({ redirect: '/' });
};
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] w-full items-center justify-center">
    <!-- 404 Error -->
    <Error404 v-if="is404" :message="errorMessage" @clear="clearAndRedirect" />

    <!-- 500+ Server Errors -->
    <Error500
      v-else-if="is500"
      :message="errorMessage"
      :error-details="isDevelopment ? error?.stack : undefined"
      :show-error-details="isDevelopment"
      :show-refresh-button="true"
      :show-home-button="true"
    />

    <!-- Generic Error (fallback) -->
    <Error500
      v-else
      :message="errorMessage"
      :error-details="isDevelopment ? error?.stack : undefined"
      :show-error-details="isDevelopment"
      :show-refresh-button="true"
      :show-home-button="true"
    />
  </div>
</template>
