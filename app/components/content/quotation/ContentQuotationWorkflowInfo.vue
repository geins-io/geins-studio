<script setup lang="ts">
import type { StatusBadgeStatus } from '#shared/types';
import type { Component } from 'vue';
import {
  LucideSend,
  LucidePackageCheck,
  LucideThumbsUp,
  LucideCheckCheck,
} from '#components';

const { t } = useI18n();

defineProps<{
  editMode?: boolean;
}>();

const requireConfirmation = defineModel<boolean>('requireConfirmation', {
  default: false,
});

interface Step {
  status: StatusBadgeStatus;
  actors?: string[];
  description: string;
}

interface Action {
  icon: Component;
  label: string;
}

interface FlowItem {
  step: Step;
  action?: Action;
}

const defaultFlow = computed<FlowItem[]>(() => [
  {
    step: {
      status: 'draft',
      actors: ['You'],
      description: t('orders.workflow_step_draft'),
    },
    action: {
      icon: LucideSend,
      label: t('send_entity', { entityName: 'quotation' }),
    },
  },
  {
    step: {
      status: 'pending',
      actors: ['Customer', 'You'],
      description: t('orders.workflow_step_pending_default'),
    },
    action: {
      icon: LucidePackageCheck,
      label: t('orders.place_order'),
    },
  },
  {
    step: {
      status: 'finalized',
      description: t('orders.workflow_step_finalized'),
    },
  },
]);

const strictFlow = computed<FlowItem[]>(() => [
  {
    step: {
      status: 'draft',
      actors: ['You'],
      description: t('orders.workflow_step_draft'),
    },
    action: {
      icon: LucideSend,
      label: t('send_entity', { entityName: 'quotation' }),
    },
  },
  {
    step: {
      status: 'pending',
      actors: ['Customer', 'You'],
      description: t('orders.workflow_step_pending'),
    },
    action: {
      icon: LucideThumbsUp,
      label: t('orders.workflow_action_accept'),
    },
  },
  {
    step: {
      status: 'accepted',
      actors: ['You'],
      description: t('orders.workflow_step_accepted'),
    },
    action: {
      icon: LucideCheckCheck,
      label: t('orders.workflow_action_confirm'),
    },
  },
  {
    step: {
      status: 'confirmed',
      actors: ['Customer', 'You'],
      description: t('orders.workflow_step_confirmed'),
    },
    action: {
      icon: LucidePackageCheck,
      label: t('orders.place_order'),
    },
  },
  {
    step: {
      status: 'finalized',
      description: t('orders.workflow_step_finalized'),
    },
  },
]);

const flows = computed(() => [
  {
    title: t('orders.workflow_default_title'),
    items: defaultFlow.value,
    name: 'default',
  },
  {
    title: t('orders.workflow_strict_title'),
    items: strictFlow.value,
    name: 'strict',
  },
]);

const getPrevAction = (
  items: FlowItem[],
  index: number,
): Action | undefined => {
  return index > 0 ? items[index - 1]?.action : undefined;
};

const isSelectedFlow = (flowName: string) => {
  if (requireConfirmation.value) {
    return flowName === 'strict';
  }
  return flowName === 'default';
};

const selectFlow = (flowName: string) => {
  requireConfirmation.value = flowName === 'strict';
};
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground inline-flex items-center"
      >
        <LucideCircleHelp class="size-4" />
      </button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>{{ $t('orders.workflow_info_title') }}</SheetTitle>
        <SheetDescription class="max-w-120">
          {{ $t('orders.workflow_info_description') }}
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <div class="grid grid-cols-2 gap-6">
          <div
            v-for="(flow, index) in flows"
            :key="index"
            :class="
              cn('relative max-w-60 space-y-2 rounded-lg border p-4', {
                'border-positive border': isSelectedFlow(flow.name),
                'hover:border-positive/50 cursor-pointer transition-colors':
                  editMode && !isSelectedFlow(flow.name),
              })
            "
            @click="editMode ? selectFlow(flow.name) : undefined"
          >
            <span
              v-if="isSelectedFlow(flow.name)"
              class="bg-card border-positive absolute -end-2 -top-2 flex size-6 items-center justify-center rounded-full border"
            >
              <LucideCheck class="text-positive size-4" />
            </span>
            <p class="text-sm font-semibold">{{ flow.title }}</p>
            <div class="flex flex-col items-center gap-2">
              <template v-for="(item, i) in flow.items" :key="i">
                <!-- Action arrow (between steps) -->
                <div
                  v-if="getPrevAction(flow.items, i)"
                  class="flex flex-col items-center gap-1"
                >
                  <LucideMinus
                    class="text-muted-foreground size-3 shrink-0 rotate-90"
                  />
                  <span
                    class="text-muted-foreground flex shrink-0 flex-wrap items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <component
                      :is="getPrevAction(flow.items, i)!.icon"
                      class="size-3"
                    />
                    {{ getPrevAction(flow.items, i)!.label }}
                  </span>
                  <LucideArrowDown
                    class="text-muted-foreground size-3 shrink-0"
                  />
                </div>

                <!-- Status box -->
                <div
                  class="w-full rounded border px-3 py-2.5 text-center text-xs"
                >
                  <StatusBadge :status="item.step.status" class="mb-2" />
                  <p v-if="item.step.actors" class="mb-0.5 text-[0.7rem]">
                    <template v-for="(actor, ai) in item.step.actors" :key="ai">
                      <span v-if="ai > 0" class="text-muted-foreground">
                        /
                      </span>
                      {{ actor }}
                    </template>
                  </p>
                  <p class="text-muted-foreground">
                    {{ item.step.description }}
                  </p>
                </div>
              </template>
            </div>
          </div>
        </div>
      </SheetBody>
      <SheetFooter>
        <SheetClose as-child>
          <Button>
            {{ $t('close') }}
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
