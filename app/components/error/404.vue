<script setup lang="ts">
import {
  LucideFileQuestion,
  LucideHome,
  LucideArrowLeft,
} from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    message?: string;
    showBackButton?: boolean;
    showHomeButton?: boolean;
  }>(),
  {
    message: 'The page you are looking for does not exist',
    showBackButton: true,
    showHomeButton: true,
  },
);

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const handleBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    emit('clear');
  }
};

const handleHome = () => {
  emit('clear');
};
</script>

<template>
  <div class="flex h-full min-h-[600px] w-full items-center justify-center p-6">
    <Empty class="max-w-md border-none">
      <EmptyMedia variant="icon">
        <LucideFileQuestion class="size-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{{ t('error.404_title') }}</EmptyTitle>
        <EmptyDescription>
          {{ message }}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Button v-if="showBackButton" variant="secondary" @click="handleBack">
            <LucideArrowLeft class="mr-2 size-4" />
            {{ t('error.go_back') }}
          </Button>
          <Button v-if="showHomeButton" @click="handleHome">
            <LucideHome class="mr-2 size-4" />
            {{ t('error.home') }}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  </div>
</template>
