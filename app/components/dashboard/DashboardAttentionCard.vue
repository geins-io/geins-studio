<script setup lang="ts">
import { DASHBOARD_BOARD_CONTEXT } from '@/lib/dashboard';
import type {
  DashboardAttentionEntry,
  DashboardAttentionTone,
} from '@/lib/dashboard-data';
import { NuxtLink } from '#components';

/**
 * One Needs attention number: a tone-tinted icon, the count with its label,
 * a short text and a link to the list it counts. As a `card` it's a row in
 * the Needs attention widget; as a `tile` it fills a widget of its own.
 */
const props = withDefaults(
  defineProps<{
    entry: DashboardAttentionEntry;
    layout?: 'card' | 'tile';
  }>(),
  { layout: 'card' },
);

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();
const board = inject(DASHBOARD_BOARD_CONTEXT, null);

const TONE_CLASSES: Record<DashboardAttentionTone, string> = {
  info: 'bg-tone-info/10 text-tone-info',
  warning: 'bg-tone-warning-bg text-tone-warning',
  danger: 'bg-tone-danger/10 text-tone-danger',
};

const icon = computed(() => resolveIcon(props.entry.icon));
const texts = computed(() => {
  const base = `dashboards.attention.${props.entry.key}`;
  return {
    label: t(`${base}.label`),
    text: props.entry.error
      ? t('dashboards.attention.error')
      : t(`${base}.text`),
    link: t(`${base}.link`),
  };
});

// While the board is edited a click would leave the page and drop the edit,
// and on an error the Retry button can't sit inside a link
const linked = computed(() => !props.entry.error && !board?.editing.value);
</script>

<template>
  <component
    :is="linked ? NuxtLink : 'div'"
    :to="linked ? entry.to : undefined"
    :class="
      cn(
        'group min-w-0',
        layout === 'card'
          ? 'bg-background flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors'
          : 'flex h-full flex-col justify-between gap-3 px-5 py-4',
        layout === 'card' && linked && 'hover:border-foreground/30',
      )
    "
  >
    <div
      :class="
        cn(
          'flex shrink-0 justify-between gap-3',
          layout === 'tile' && 'items-start',
        )
      "
    >
      <span
        :class="
          cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            TONE_CLASSES[entry.tone],
          )
        "
      >
        <component :is="icon" class="size-4" aria-hidden="true" />
      </span>
      <template v-if="layout === 'tile'">
        <ButtonIcon
          v-if="entry.error"
          icon="retry"
          variant="secondary"
          size="sm"
          @click="entry.retry()"
        >
          {{ t('retry') }}
        </ButtonIcon>
        <span
          v-else
          class="text-link inline-flex items-center gap-1 text-sm font-semibold whitespace-nowrap"
        >
          {{ texts.link }}
          <LucideArrowUpRight
            class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </span>
      </template>
    </div>
    <div :class="cn('min-w-0', layout === 'card' && 'flex-1')">
      <div class="flex items-baseline gap-2">
        <Skeleton
          v-if="entry.loading"
          :class="cn('self-center', layout === 'tile' ? 'h-8 w-10' : 'h-6 w-8')"
        />
        <span
          v-else-if="!entry.error"
          :class="
            cn(
              'leading-none font-semibold tracking-tight tabular-nums',
              layout === 'tile' ? 'text-3xl' : 'text-2xl',
            )
          "
        >
          {{ entry.count }}
        </span>
        <span class="truncate text-sm font-medium">{{ texts.label }}</span>
      </div>
      <p
        :class="
          cn(
            'text-muted-foreground truncate text-xs',
            layout === 'tile' ? 'mt-1.5' : 'mt-1',
          )
        "
      >
        {{ texts.text }}
      </p>
    </div>
    <template v-if="layout === 'card'">
      <ButtonIcon
        v-if="entry.error"
        icon="retry"
        variant="secondary"
        size="sm"
        @click="entry.retry()"
      >
        {{ t('retry') }}
      </ButtonIcon>
      <span
        v-else
        class="text-link hidden items-center gap-1 text-sm font-semibold whitespace-nowrap sm:inline-flex"
      >
        {{ texts.link }}
        <LucideArrowUpRight
          class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </span>
    </template>
  </component>
</template>
