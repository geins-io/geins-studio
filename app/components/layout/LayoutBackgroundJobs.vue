<script setup lang="ts">
import type { BackgroundJob, StatusBadgeStatus } from '#shared/types';

useBackgroundJobRunner();
const { jobs, pending, hasFinished, panelOpen, message, clearFinished } =
  useBackgroundJobs();
const { t } = useI18n();

// Fully controlled, hidden while the panel is open. Toggling `:open` between
// `false` and `undefined` instead makes reka's passive v-model store
// `undefined`, which warns on every re-render.
const tooltipOpen = ref(false);

// Newest first. The store appends restored jobs, so sort rather than reverse.
const rows = computed(() =>
  [...jobs.value].sort((a, b) => b.startedAt - a.startedAt),
);

// Keyed by every spec kind, so a new kind fails typecheck until it has a row.
const JOB_KINDS: Record<
  BackgroundJob['spec']['kind'],
  { icon: string; activity: string }
> = {
  move: { icon: 'FolderInput', activity: 'background_jobs.moving' },
  replace: { icon: 'Replace', activity: 'background_jobs.replacing' },
  purge: { icon: 'Trash2', activity: 'background_jobs.deleting' },
  'due-purge': { icon: 'Trash2', activity: 'background_jobs.deleting' },
};
const { resolveIcon } = useLucideIcon();
const activity = (job: BackgroundJob): string =>
  message(job.activity ?? { key: JOB_KINDS[job.spec.kind].activity });

const badge = (
  job: BackgroundJob,
): { status: StatusBadgeStatus; label: string } => {
  if (job.state === 'pending') {
    return { status: 'in-progress', label: t('background_jobs.in_progress') };
  }
  if (job.state === 'timeout') {
    return { status: 'pending', label: t('background_jobs.delayed') };
  }
  return job.progress?.skipped
    ? { status: 'partial', label: t('background_jobs.partly_done') }
    : { status: 'completed', label: t('background_jobs.done') };
};

const detail = (job: BackgroundJob): string | null => {
  if (job.state === 'timeout') return t('background_jobs.timeout');
  const skipped = job.progress?.skipped ?? 0;
  if (job.state === 'completed' && skipped) {
    return t('background_jobs.skipped', { count: skipped }, skipped);
  }
  return null;
};
</script>

<template>
  <!-- Popover inside Tooltip, not around it: both are poppers, and the trigger
       anchors to the nearest one — the other way round the panel gets no
       anchor and renders off-screen. -->
  <TooltipProvider v-if="jobs.length" :delay-duration="100">
    <Tooltip
      :open="tooltipOpen && !panelOpen"
      @update:open="tooltipOpen = $event"
    >
      <Popover v-model:open="panelOpen">
        <TooltipTrigger as-child>
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="relative size-7 flex-shrink-0"
              data-testid="background-jobs-trigger"
            >
              <LucideLoaderCircle
                v-if="pending.length"
                class="size-4 animate-spin text-blue-600 dark:text-blue-400"
              />
              <LucideCircleCheck v-else class="text-positive size-4" />
              <span
                v-if="pending.length"
                class="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold"
              >
                {{ pending.length }}
              </span>
              <span class="sr-only">{{ $t('background_jobs.title') }}</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{{ $t('background_jobs.title') }}</TooltipContent>
        <PopoverContent align="end" class="w-96 p-0">
          <div class="flex items-center justify-between border-b px-4 py-2.5">
            <p class="text-sm font-semibold">
              {{ $t('background_jobs.title') }}
            </p>
            <Button
              v-if="hasFinished"
              variant="ghost"
              size="sm"
              class="h-7 px-2 text-xs"
              @click="clearFinished"
            >
              {{ $t('background_jobs.clear_finished') }}
            </Button>
          </div>
          <ul class="max-h-96 divide-y overflow-y-auto">
            <li v-for="job in rows" :key="job.id" class="px-4 py-3">
              <div class="flex items-start gap-3">
                <div
                  class="bg-muted flex size-8 flex-shrink-0 items-center justify-center rounded-md"
                >
                  <component
                    :is="resolveIcon(JOB_KINDS[job.spec.kind].icon)"
                    class="text-muted-foreground size-4"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">
                    {{ message(job.label) }}
                  </p>
                  <p
                    v-if="job.state === 'pending'"
                    class="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs"
                  >
                    <LucideLoaderCircle class="size-3 animate-spin" />
                    {{ activity(job) }}
                  </p>
                  <p
                    v-else-if="detail(job)"
                    class="text-muted-foreground mt-0.5 text-xs"
                  >
                    {{ detail(job) }}
                  </p>
                </div>
                <StatusBadge v-bind="badge(job)" class="flex-shrink-0" />
              </div>
            </li>
          </ul>
        </PopoverContent>
      </Popover>
    </Tooltip>
  </TooltipProvider>
</template>
