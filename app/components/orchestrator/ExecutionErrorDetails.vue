<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import type { ExecutionError } from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';
import { LucideTriangleAlert, LucideCopy, LucideCheck } from '#components';

interface Props {
  error: ExecutionError;
  title?: string | null;
  /** Hides the type/code badges and child link — for tight spaces. */
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: null,
  compact: false,
});

const { childFailure, errorCode } = useExecutionErrors();

const child = computed(() => childFailure(props.error));
const code = computed(() => errorCode(props.error));

const { copy, copied } = useClipboard({ copiedDuring: 1500, legacy: true });

const copyText = computed(() =>
  [
    props.error.type ? `[${props.error.type}]` : null,
    props.error.message,
    child.value?.message && child.value.message !== props.error.message
      ? child.value.message
      : null,
  ]
    .filter(Boolean)
    .join('\n'),
);
</script>

<template>
  <Alert variant="destructive" :class="compact ? 'px-3 py-2' : ''">
    <!-- Before the icon: Alert pads every sibling that follows its svg. -->
    <TooltipProvider :delay-duration="100">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="icon"
            variant="ghost"
            class="absolute top-1.5 right-1.5 size-7"
            :aria-label="$t('executions.copy_error')"
            @click="copy(copyText)"
          >
            <component
              :is="copied ? LucideCheck : LucideCopy"
              class="size-3.5"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ copied ? $t('executions.copied') : $t('executions.copy_error') }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <LucideTriangleAlert
      :class="compact ? 'top-2.5! left-3! size-3.5' : 'size-4'"
    />
    <AlertTitle
      v-if="title || code || (error.type && !compact)"
      class="flex flex-wrap items-center gap-1.5 pr-7"
    >
      <span v-if="title">{{ title }}</span>
      <Badge
        v-if="error.type && !compact"
        size="sm"
        variant="negative-light"
        class="font-mono"
      >
        {{ error.type }}
      </Badge>
      <Badge v-if="code" size="sm" variant="negative-light" class="font-mono">
        {{ $t('executions.error_code', { code }) }}
      </Badge>
    </AlertTitle>
    <AlertDescription class="space-y-2 pr-7">
      <p
        :class="[
          'text-destructive font-mono wrap-break-word whitespace-pre-wrap',
          compact ? 'text-xs' : 'text-sm',
        ]"
      >
        {{ error.message }}
      </p>
      <div
        v-if="child && !compact"
        class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
      >
        <span>
          {{
            child.nodeName
              ? $t('executions.failed_in_child_at', { node: child.nodeName })
              : $t('executions.failed_in_child')
          }}
          <template v-if="child.message && child.message !== error.message">
            :
            <span class="font-mono">{{ child.message }}</span>
          </template>
        </span>
        <Button
          v-if="child.instanceId"
          as-child
          size="sm"
          variant="link"
          class="h-auto p-0 text-xs"
        >
          <NuxtLink :to="entityEditUrl('execution', child.instanceId)">
            {{ $t('executions.open_child_execution') }}
          </NuxtLink>
        </Button>
      </div>
      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </AlertDescription>
  </Alert>
</template>
