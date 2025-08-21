<script setup lang="ts">
const _props = defineProps<{
  id: string;
  quantityLevels: PricelistRule[];
  className?: string;
}>();

const emit = defineEmits<{
  (e: 'edit', id: string): void;
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
              <table>
                <thead>
                  <tr>
                    <th>{{ $t('quantity') }}</th>
                    <th>{{ $t('price') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(rule, index) in quantityLevels" :key="index">
                    <td>{{ rule.quantity }}</td>
                    <td>{{ rule.price }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </ContentTextTooltip>
        <Button size="icon-xs" variant="ghost" @click="emit('edit', id)">
          <LucideEdit class="size-3" />
        </Button>
      </div>
      <div v-else class="flex w-full items-center justify-between gap-2">
        <span class="text-muted-foreground">0</span>
        <Button size="icon-xs" variant="ghost" @click="emit('edit', id)">
          <LucidePlus class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
