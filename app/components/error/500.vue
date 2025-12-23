<script setup lang="ts">
import {
  LucideServerCrash,
  LucideRefreshCw,
  LucideHome,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    message?: string;
    errorDetails?: string;
    showErrorDetails?: boolean;
  }>(),
  {
    message: '',
    showErrorDetails: false,
  },
);

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const handleRefresh = () => {
  window.location.reload();
};

const handleHome = () => {
  emit('clear');
};
</script>

<template>
  <div class="flex h-full min-h-[600px] w-full items-center justify-center p-6">
    <Empty class="max-w-md border-none">
      <EmptyMedia variant="icon">
        <LucideServerCrash class="size-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{{ $t('error.500_title') }}</EmptyTitle>
        <EmptyDescription>
          {{ message || $t('error.500_description') }}
        </EmptyDescription>
        <EmptyDescription v-if="showErrorDetails && errorDetails" class="mt-2">
          <details class="text-left">
            <summary class="cursor-pointer text-xs font-medium">
              {{ $t('error.error_details') }}
            </summary>
            <pre
              class="text-muted-foreground bg-secondary mt-2 max-h-40 overflow-auto rounded p-2 text-xs"
            >
              {{ errorDetails }}
            </pre>
          </details>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" @click="handleRefresh">
            <LucideRefreshCw class="mr-2 size-4" />
            {{ $t('error.refresh_page') }}
          </Button>
          <Button @click="handleHome">
            <LucideHome class="mr-2 size-4" />
            {{ $t('error.home') }}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  </div>
</template>
