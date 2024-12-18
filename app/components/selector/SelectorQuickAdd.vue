<script setup lang="ts">
const props = defineProps<{
  dataSet: Product[];
  selection: SelectorSelection;
}>();
const focused = ref(false);
const emit = defineEmits<{
  (e: 'add' | 'remove', payload: number): void;
}>();
const addItem = (id: number) => {
  emit('add', id);
  focused.value = false;
};
const removeItem = (id: number) => {
  emit('remove', id);
  focused.value = false;
};
const onBlur = (event: FocusEvent) => {
  const searchResults = document.querySelector('.quick-search-results');
  if (searchResults?.contains(event.relatedTarget as Node)) return;
  focused.value = false;
};
const isSelected = (id: number) => {
  return props.selection.ids?.includes(id);
};
</script>
<template>
  <Command class="relative overflow-visible">
    <CommandInput
      placeholder="Quick add product.."
      @focus="focused = true"
      @blur="onBlur"
    />
    <CommandList
      :class="
        cn(
          'quick-search-results absolute left-0 top-9 z-50 w-full overflow-x-hidden rounded-b-lg border border-t-0 bg-card',
          `${focused ? '' : '!hidden'}`,
        )
      "
    >
      <CommandEmpty>No products found.</CommandEmpty>
      <CommandGroup
        heading="Products"
        :class="`${dataSet.length ? '!block' : ''}`"
      >
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
              v-if="!isSelected(product.id)"
              class="ml-auto shrink-0 p-1"
              variant="ghost"
              size="icon"
              @click="addItem(product.id)"
            >
              <LucideCirclePlus class="size-4" />
            </Button>
            <Button
              v-else
              class="ml-auto shrink-0 p-1"
              variant="ghost"
              size="icon"
              @click="removeItem(product.id)"
            >
              <LucideCircleCheck class="size-4 text-positive" />
            </Button>
          </div>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</template>
