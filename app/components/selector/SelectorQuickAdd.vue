<script setup lang="ts" generic="T">
const _props = defineProps<{
  dataSet: Product[];
}>();
const selection = ref<number[]>([]);
const focused = ref(false);
const emit = defineEmits<{
  (e: 'add', payload: number): void;
}>();
const addItem = (id: number) => {
  console.log('🚀 ~ add ~ id:', id);
  emit('add', id);
};
</script>
<template>
  <Command v-model="selection" multiple class="relative overflow-visible">
    <CommandInput
      placeholder="Quick add product.."
      @focus="focused = true"
      @blur="focused = false"
    />
    <CommandList
      v-if="focused"
      class="absolute left-0 top-9 z-50 w-full overflow-x-hidden rounded-b-lg border border-t-0 bg-card"
    >
      <CommandEmpty>No products found.</CommandEmpty>
      <CommandGroup heading="Products">
        <CommandItem
          v-for="product in dataSet"
          :key="product.id"
          :value="product.id + ' ' + product.name"
          class="pr-0 data-[highlighted]:bg-card"
        >
          <div class="flex w-full items-center gap-3 text-xs">
            <img
              :src="product.image"
              alt="Product image"
              class="size-6 shrink-0 rounded-lg"
            />
            <strong>{{ product.id }}</strong>
            <span class="truncate">{{ product.name }}</span>
            <Button
              class="ml-auto shrink-0 p-1"
              variant="ghost"
              size="icon"
              @click="addItem(product.id)"
            >
              <LucideCirclePlus class="size-4" />
            </Button>
          </div>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</template>
