<script setup lang="ts">
const _props = defineProps<{
  id: string;
  name: string;
  quantityLevels: PricelistRule[];
  className?: string;
  vatDescription: string;
}>();

const emit = defineEmits<{
  (e: 'edit', payload: { id: string; name: string }): void;
}>();
</script>
<template>
  <div :class="cn(className, 'pl-5')">
    <div class="flex w-full items-center justify-center">
      <div
        v-if="quantityLevels.length > 0"
        class="flex w-full items-center justify-between gap-2"
      >
        <ContentTextTooltip>
          {{ quantityLevels.length }}
          <template #tooltip>
            <div>
              <table class="text-xs">
                <thead>
                  <tr>
                    <th class="px-1.5 py-1">{{ $t('quantity') }}</th>
                    <th class="px-1.5 py-1">{{ $t('margin') }}</th>
                    <th class="px-1.5 py-1">{{ $t('discount') }}</th>
                    <th class="px-1.5 py-1">
                      {{ $t('price') }} ({{ vatDescription }})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(rule, index) in quantityLevels"
                    :key="index"
                    class="text-muted-foreground"
                  >
                    <td class="px-1.5 py-0.5">{{ rule.quantity }}</td>
                    <td class="px-1.5 py-0.5">{{ rule.margin }}%</td>
                    <td class="px-1.5 py-0.5">{{ rule.discountPercent }}%</td>
                    <td class="px-1.5 py-0.5">{{ rule.price }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </ContentTextTooltip>
        <Button
          size="icon-xs"
          variant="ghost"
          @click="emit('edit', { id, name })"
        >
          <LucideEdit class="size-3" />
        </Button>
      </div>
      <div v-else class="flex w-full items-center justify-between gap-2">
        <span class="text-muted-foreground">0</span>
        <Button
          size="icon-xs"
          variant="ghost"
          @click="emit('edit', { id, name })"
        >
          <LucidePlus class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
