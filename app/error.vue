<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps({
  error: Object as () => NuxtError,
});

const config = useRuntimeConfig();
const isDevelopment = config.public.NODE_ENV === 'development';

// Determine which error component to show based on status code
const is404 = computed(() => props.error?.statusCode === 404);

const clearAndRedirect = async () => {
  clearError({ redirect: '/' });
};
</script>

<template>
  <div>
    <NuxtLayout name="default">
      <div class="flex h-[calc(100vh-64px)] w-full items-center justify-center">
        <!-- 404 Error -->
        <Error404
          v-if="is404"
          :message="error?.message"
          @clear="clearAndRedirect"
        />

        <!-- Generic Error (fallback) -->
        <Error500
          v-else
          :message="error?.message"
          :error-details="isDevelopment ? error?.stack : undefined"
          :show-error-details="isDevelopment"
          @clear="clearAndRedirect"
        />
      </div>
    </NuxtLayout>
  </div>
</template>
