<script setup lang="ts">
import type { DashboardQueueItem } from '#shared/types';
import { DASHBOARD_BOARD_CONTEXT } from '@/lib/dashboard';
import { companyInitials } from '@/lib/dashboard-data';
import { NuxtLink } from '#components';

/**
 * One row in a dashboard queue, linking to its quotation or workflow run:
 * the company's initials, title over a meta line, an age (or expiry) on the
 * right and the status badge last, at the right edge.
 */
defineProps<{
  item: DashboardQueueItem;
}>();

const board = inject(DASHBOARD_BOARD_CONTEXT, null);
// A click while the board is edited would leave the page and drop the edit
const linked = computed(() => !board?.editing.value);
</script>

<template>
  <component
    :is="linked ? NuxtLink : 'div'"
    :to="linked ? item.to : undefined"
    class="group flex min-w-0 items-center gap-3 border-b py-2.5"
  >
    <Avatar v-if="item.avatar">
      <AvatarFallback
        class="bg-tone-neutral/10 text-tone-neutral-foreground border-0 text-[11px] font-semibold"
      >
        {{ companyInitials(item.avatar) }}
      </AvatarFallback>
    </Avatar>
    <div class="min-w-0 flex-1">
      <p
        :class="
          cn('truncate text-sm font-medium', linked && 'group-hover:underline')
        "
      >
        {{ item.title }}
      </p>
      <p class="text-muted-foreground truncate text-xs">{{ item.meta }}</p>
    </div>
    <span
      v-if="item.aside"
      class="text-muted-foreground text-xs whitespace-nowrap"
    >
      {{ item.aside }}
    </span>
    <StatusBadge
      v-if="item.status !== undefined"
      :status="item.status"
      :label="item.statusLabel"
    />
  </component>
</template>
