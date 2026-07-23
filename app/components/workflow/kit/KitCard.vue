<script setup lang="ts">
import type { KitSummary } from '#shared/types';
import type { KitInstallStatus } from '@/composables/orchestrator/useKits';
import type { Component } from 'vue';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

const props = defineProps<{
  kit: KitSummary;
  status: KitInstallStatus;
}>();

const emit = defineEmits<{
  install: [kit: KitSummary];
  manage: [kit: KitSummary];
}>();

const initials = computed(() => {
  const name = props.kit.name.trim();
  if (name.length === 0) return '?';
  if (name.length === 1) return name.toUpperCase();
  return (name.charAt(0) + name.charAt(name.length - 1)).toUpperCase();
});

const tags = computed(() => props.kit.tags ?? []);

// ─── Kit logo ──────────────────────────────────────────────────────
// Logos are matched by the slug of the kit name, category, or any tag — see
// useKitLogo. Kits with no match fall back to the initials avatar.
const { resolveKitLogo } = useKitLogo();
const logo = computed<Component | null>(() =>
  resolveKitLogo([
    props.kit.name,
    props.kit.category,
    ...(props.kit.tags ?? []),
  ]),
);
</script>

<template>
  <Card
    class="hover:border-primary/30 group relative flex flex-col transition-all duration-200 hover:shadow-md"
  >
    <CardHeader class="pt-5 pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <div
            v-if="logo"
            class="bg-background flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-1.5"
          >
            <component
              :is="logo"
              class="size-6 max-h-full max-w-full"
              :font-controlled="false"
            />
          </div>
          <Avatar v-else class="size-10 rounded-lg">
            <AvatarFallback class="rounded-lg text-sm">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1">
            <p class="truncate text-base leading-tight font-semibold">
              {{ kit.name }}
            </p>
            <p class="text-muted-foreground mt-0.5 truncate text-xs">
              {{ $t('kits.by_author', { author: kit.author }) }}
            </p>
          </div>
        </div>
        <Badge
          v-if="status === 'installed'"
          variant="positive-light"
          size="sm"
          class="shrink-0"
        >
          <LucideCircleCheck class="size-3" />
          {{ $t('kits.installed') }}
        </Badge>
        <Badge
          v-else-if="status === 'update-available'"
          variant="warning-light"
          size="sm"
          class="shrink-0"
        >
          <LucideArrowUpCircle class="size-3" />
          {{ $t('kits.update_available') }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="flex flex-1 flex-col gap-3 pt-0">
      <p class="text-muted-foreground line-clamp-2 min-h-[2.5rem] text-sm">
        {{ kit.description || '—' }}
      </p>

      <!-- Meta: category + counts -->
      <div
        class="text-muted-foreground flex flex-wrap items-center gap-3 text-xs"
      >
        <span v-if="kit.category" class="inline-flex items-center gap-1">
          <LucideTag class="size-3" />
          {{ kit.category }}
        </span>
        <span class="inline-flex items-center gap-1">
          <LucideWorkflow class="size-3" />
          {{ $t('kits.workflows_count', { count: kit.workflowCount ?? 0 }) }}
        </span>
        <span class="inline-flex items-center gap-1">
          <LucideKeyRound class="size-3" />
          {{ $t('kits.variables_count', { count: kit.variableCount ?? 0 }) }}
        </span>
      </div>

      <!-- Tags -->
      <div v-if="tags.length" class="flex flex-wrap gap-1">
        <Tag v-for="tag in tags" :key="tag" :label="tag" size="sm" />
      </div>

      <!-- Actions -->
      <div class="mt-auto flex items-center justify-end gap-2 pt-2">
        <Button
          v-if="status === 'available'"
          size="sm"
          @click="emit('install', kit)"
        >
          <LucideDownload class="mr-1.5 size-3.5" />
          {{ $t('kits.install') }}
        </Button>
        <Button
          v-else-if="status === 'update-available'"
          size="sm"
          @click="emit('manage', kit)"
        >
          <LucideArrowUpCircle class="mr-1.5 size-3.5" />
          {{ $t('kits.upgrade') }}
        </Button>
        <Button v-else size="sm" variant="outline" @click="emit('manage', kit)">
          {{ $t('kits.manage') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
