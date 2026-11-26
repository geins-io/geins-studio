<script setup lang="ts">
import type { DashboardQueueItem } from '#shared/types';
import type { Component } from 'vue';

/**
 * A dashboard list of quotations or workflow runs as queue rows, with its
 * loading skeleton, empty state and error state with Retry.
 */
withDefaults(
  defineProps<{
    items: DashboardQueueItem[];
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    /** i18n entity key for the empty and error texts, e.g. `quotation` */
    entityKey: string;
    emptyIcon: Component;
    /** Whether the rows have a company avatar, so the skeleton matches */
    withAvatar?: boolean;
  }>(),
  { withAvatar: true },
);

const SKELETON_ROWS = 4;
</script>

<template>
  <div v-if="loading" class="flex flex-col" aria-busy="true">
    <div
      v-for="n in SKELETON_ROWS"
      :key="n"
      class="flex items-center gap-3 border-b py-2.5"
    >
      <Skeleton v-if="withAvatar" class="size-8 shrink-0 rounded-full" />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-3 w-1/3" />
      </div>
    </div>
  </div>
  <!-- Less padding than the page-sized default: the widget body is small -->
  <Empty v-else-if="error" class="h-full gap-4 p-2 md:p-2">
    <EmptyHeader>
      <EmptyMedia variant="destructive">
        <LucideCircleAlert />
      </EmptyMedia>
      <EmptyTitle>
        {{ $t('error_fetching_entity', { entityKey }, 2) }}
      </EmptyTitle>
    </EmptyHeader>
    <EmptyContent v-if="onRetry">
      <ButtonIcon icon="retry" variant="secondary" @click="onRetry">
        {{ $t('retry') }}
      </ButtonIcon>
    </EmptyContent>
  </Empty>
  <Empty v-else-if="!items.length" class="h-full gap-4 p-2 md:p-2">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <component :is="emptyIcon" />
      </EmptyMedia>
      <EmptyTitle>{{ $t('no_entity', { entityKey }, 2) }}</EmptyTitle>
    </EmptyHeader>
  </Empty>
  <div v-else class="flex flex-col">
    <DashboardQueueRow v-for="item in items" :key="item.id" :item="item" />
  </div>
</template>
