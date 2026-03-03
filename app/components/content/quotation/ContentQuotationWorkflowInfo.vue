<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground inline-flex items-center"
      >
        <LucideCircleHelp class="size-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" :side-offset="8" class="w-auto max-w-[480px]">
      <div class="grid grid-cols-2 gap-6">
        <!-- Default flow -->
        <div class="space-y-2">
          <p class="text-xs font-semibold">
            {{ t('orders.workflow_default_title') }}
          </p>
          <div class="flex flex-col items-center gap-2">
            <div class="w-full rounded border px-3 py-2 text-center text-xs">
              <StatusBadge status="draft" class="mb-1.5" />
              <p class="text-muted-foreground">
                {{ t('orders.workflow_step_draft') }}
              </p>
            </div>
            <div class="flex flex-col items-center gap-1">
              <LucideMinus
                class="text-muted-foreground size-3 shrink-0 rotate-90"
              />
              <span
                class="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs font-bold"
              >
                <LucideSend class="size-3" />
                {{ t('send_entity', { entityName: 'quotation' }) }}
              </span>
              <LucideArrowDown class="text-muted-foreground size-3 shrink-0" />
            </div>
            <div class="w-full rounded border px-3 py-2 text-center text-xs">
              <StatusBadge status="pending" class="mb-1.5" />
              <p class="text-muted-foreground">
                {{ t('orders.workflow_step_pending_default') }}
              </p>
            </div>
            <div class="flex flex-col items-center gap-1">
              <LucideMinus
                class="text-muted-foreground size-3 shrink-0 rotate-90"
              />
              <span
                class="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs font-bold"
              >
                <LucidePackageCheck class="size-3" />
                {{ t('orders.place_order') }}
              </span>
              <LucideArrowDown class="text-muted-foreground size-3 shrink-0" />
              <div class="w-full rounded border px-3 py-2 text-center text-xs">
                <StatusBadge status="finalized" class="mb-1.5" />
                <p class="text-muted-foreground">
                  {{ t('orders.workflow_step_finalized') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Strict flow -->
        <div class="space-y-2">
          <p class="text-xs font-semibold">
            {{ t('orders.workflow_strict_title') }}
          </p>
          <div class="flex flex-col items-center gap-1">
            <div class="w-full rounded border px-3 py-2 text-center text-xs">
              <p class="font-medium">Draft</p>
              <p class="text-muted-foreground">
                {{ t('orders.workflow_step_draft') }}
              </p>
            </div>
            <LucideArrowDown class="text-muted-foreground size-3.5 shrink-0" />
            <div class="w-full rounded border px-3 py-2 text-center text-xs">
              <p class="font-medium">Pending</p>
              <p class="text-muted-foreground">
                {{ t('orders.workflow_step_pending') }}
              </p>
            </div>
            <LucideArrowDown class="text-muted-foreground size-3.5 shrink-0" />
            <div class="w-full rounded border px-3 py-2 text-center text-xs">
              <p class="font-medium">Accepted</p>
              <p class="text-muted-foreground">
                {{ t('orders.workflow_step_accepted') }}
              </p>
            </div>
            <LucideArrowDown class="text-muted-foreground size-3.5 shrink-0" />
            <div
              class="bg-primary/10 text-primary w-full rounded border px-3 py-2 text-center text-xs"
            >
              <p class="font-medium">Confirmed</p>
              <p class="opacity-80">
                {{ t('orders.workflow_step_confirmed') }}
              </p>
            </div>
          </div>
          <p class="text-muted-foreground text-xs">
            {{ t('orders.workflow_strict_description') }}
          </p>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
