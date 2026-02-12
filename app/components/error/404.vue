<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message: '',
  },
);

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
        <EmptyTitle>{{ $t('error.404_title') }}</EmptyTitle>
        <EmptyDescription>
          {{ message || $t('error.404_description') }}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" @click="handleBack">
            <LucideArrowLeft class="mr-2 size-4" />
            {{ $t('error.go_back') }}
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
