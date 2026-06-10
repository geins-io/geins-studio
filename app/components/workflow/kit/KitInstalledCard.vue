<script setup lang="ts">
import type { KitInstallation } from '#shared/types';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

const props = defineProps<{
  installation: KitInstallation;
  updateAvailable?: boolean;
  latestVersion?: string;
}>();

const emit = defineEmits<{
  upgrade: [installation: KitInstallation];
  uninstall: [installation: KitInstallation];
}>();

const { formatDate } = useDate();

const initials = computed(() => {
  const name = props.installation.kitName.trim();
  if (name.length === 0) return '?';
  if (name.length === 1) return name.toUpperCase();
  return (name.charAt(0) + name.charAt(name.length - 1)).toUpperCase();
});

const workflows = computed(() => props.installation.workflows ?? []);
const variableCount = computed(
  () => (props.installation.variables ?? []).length,
);
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="pt-5 pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <Avatar class="size-10 rounded-lg">
            <AvatarFallback class="rounded-lg text-sm">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1">
            <p class="truncate text-base leading-tight font-semibold">
              {{ installation.kitName }}
            </p>
            <p
              class="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs"
            >
              v{{ installation.kitVersion }}
              <Badge v-if="updateAvailable" variant="warning-light" size="sm">
                <LucideArrowUpCircle class="size-3" />
                {{
                  latestVersion
                    ? $t('kits.update_to', { version: latestVersion })
                    : $t('kits.update_available')
                }}
              </Badge>
            </p>
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent class="flex flex-1 flex-col gap-3 pt-0">
      <div
        class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      >
        <NuxtLink
          v-if="workflows.length"
          :to="`/orchestrator/workflows/list?kit=${installation.id}`"
          class="hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
        >
          <LucideWorkflow class="size-3" />
          {{ $t('kits.workflows_count', { count: workflows.length }) }}
        </NuxtLink>
        <span v-else class="inline-flex items-center gap-1">
          <LucideWorkflow class="size-3" />
          {{ $t('kits.workflows_count', { count: workflows.length }) }}
        </span>
        <NuxtLink
          v-if="variableCount"
          :to="`/settings/orchestrator/variables/list?kit=${installation.id}`"
          class="hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
        >
          <LucideKeyRound class="size-3" />
          {{ $t('kits.variables_count', { count: variableCount }) }}
        </NuxtLink>
        <span v-else class="inline-flex items-center gap-1">
          <LucideKeyRound class="size-3" />
          {{ $t('kits.variables_count', { count: variableCount }) }}
        </span>
        <span
          v-if="installation.installedAt"
          class="inline-flex items-center gap-1"
        >
          <LucideCalendar class="size-3" />
          {{ formatDate(installation.installedAt) }}
        </span>
        <span class="inline-flex items-center gap-1">
          <LucideUser class="size-3" />
          {{ installation.installedBy }}
        </span>
      </div>

      <!-- Actions -->
      <div class="mt-auto flex items-center justify-end gap-2 pt-2">
        <Button
          v-if="updateAvailable"
          size="sm"
          @click="emit('upgrade', installation)"
        >
          <LucideArrowUpCircle class="mr-1.5 size-3.5" />
          {{ $t('kits.upgrade') }}
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="emit('uninstall', installation)"
        >
          <LucideTrash2 class="mr-1.5 size-3.5" />
          {{ $t('kits.uninstall') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
