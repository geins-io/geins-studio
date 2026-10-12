<script setup lang="ts">
import type { BackgroundJob } from '#shared/types';

useBackgroundJobRunner();
const { jobs, pending, hasFinished, panelOpen, message, clearFinished } =
  useBackgroundJobs();

const percent = (job: BackgroundJob): number | null =>
  job.progress?.total
    ? Math.min(100, Math.round((job.progress.done / job.progress.total) * 100))
    : null;
</script>

<template>
  <!-- Popover inside Tooltip, not around it: both are poppers, and the trigger
       anchors to the nearest one — the other way round the panel gets no
       anchor and renders off-screen. -->
  <TooltipProvider v-if="jobs.length" :delay-duration="100">
    <Tooltip :open="panelOpen ? false : undefined">
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
                class="text-muted-foreground size-4 animate-spin"
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
        <PopoverContent align="end" class="w-80 p-0">
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
          <ul class="max-h-80 divide-y overflow-y-auto">
            <li v-for="job in jobs" :key="job.id" class="flex gap-3 px-4 py-3">
              <LucideLoaderCircle
                v-if="job.state === 'pending'"
                class="text-muted-foreground mt-0.5 size-4 flex-shrink-0 animate-spin"
              />
              <LucideCircleCheck
                v-else-if="job.state === 'completed' && !job.progress?.skipped"
                class="text-positive mt-0.5 size-4 flex-shrink-0"
              />
              <LucideTriangleAlert
                v-else
                class="text-warning mt-0.5 size-4 flex-shrink-0"
              />
              <div class="grid min-w-0 flex-1 gap-1.5">
                <p class="truncate text-sm">{{ message(job.label) }}</p>
                <Progress
                  v-if="job.state === 'pending' && percent(job) !== null"
                  :model-value="percent(job)"
                  class="h-1.5"
                />
                <p class="text-muted-foreground text-xs">
                  <template v-if="job.state === 'pending'">
                    {{
                      job.progress?.total
                        ? $t('background_jobs.progress', {
                            done: job.progress.done,
                            total: job.progress.total,
                          })
                        : $t('background_jobs.in_progress')
                    }}
                  </template>
                  <template v-else-if="job.state === 'timeout'">
                    {{ $t('background_jobs.timeout') }}
                  </template>
                  <template v-else-if="job.progress?.skipped">
                    {{
                      $t(
                        'background_jobs.skipped',
                        { count: job.progress.skipped },
                        job.progress.skipped,
                      )
                    }}
                  </template>
                  <template v-else>{{ $t('background_jobs.done') }}</template>
                </p>
              </div>
            </li>
          </ul>
        </PopoverContent>
      </Popover>
    </Tooltip>
  </TooltipProvider>
</template>
