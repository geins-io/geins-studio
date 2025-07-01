<script setup lang="ts" generic="T extends SelectorEntity">
const props = defineProps<{
  entities: T[];
  selection: string[];
  entityName: string;
  showImage?: boolean;
  showId?: boolean;
}>();

const focused = ref(false);
const input = ref(null);
const emit = defineEmits<{
  (e: 'add' | 'remove', payload: string): void;
}>();

const addItem = (id: string) => {
  emit('add', id);
  focused.value = false;
};
const removeItem = (id: string) => {
  emit('remove', id);
  focused.value = false;
};

const handleFocused = async () => {
  focused.value = true;
};
const handleOutsideClick = () => {
  focused.value = false;
};
const isSelected = (id: string) => {
  return props.selection.includes(id);
};

const handleClick = (id: string) => {
  if (isSelected(id)) {
    removeItem(id);
  } else {
    addItem(id);
  }
};
</script>
<template>
  <div v-click-outside="handleOutsideClick" class="w-full">
    <Command
      :class="cn(focused ? 'border-primary' : '', 'relative overflow-visible')"
    >
      <CommandInput
        ref="input"
        :placeholder="$t('quick_add_entity', { entityName }, 2)"
        @focus="handleFocused"
      />
      <Popover :open="focused">
        <PopoverAnchor />
        <PopoverContent
          class="w-[--reka-popper-anchor-width] rounded-lg p-0"
          @open-auto-focus.prevent
        >
          <CommandList
            :class="
              cn('quick-search-results overflow-x-hidden rounded-lg bg-card')
            "
          >
            <CommandEmpty>{{
              $t('no_entity_found', { entityName }, 2)
            }}</CommandEmpty>
            <CommandGroup
              :heading="$t('entity_caps', { entityName }, 2)"
              class="text-left"
            >
              <CommandItem
                v-for="entity in entities"
                :key="entity._id"
                :value="entity._id + ' ' + entity.name"
                class="border-0 py-0.5 data-[highlighted]:bg-card"
              >
                <Button
                  class="flex h-auto w-full items-center gap-3 border-0 p-1 px-1.5 text-xs duration-75"
                  variant="ghost"
                  @click="handleClick(entity._id)"
                >
                  <img
                    v-if="showImage && (entity.image || entity.thumbnail)"
                    :src="entity.image || entity.thumbnail"
                    alt="entity image"
                    class="size-6 shrink-0 rounded-lg"
                  />
                  <strong v-if="showId">{{ entity._id }}</strong>
                  <span class="truncate">{{ entity.name }}</span>
                  <span
                    v-if="isSelected(entity._id)"
                    class="ml-auto shrink-0 p-1"
                  >
                    <LucideCircleCheck class="size-4 text-positive" />
                  </span>
                  <span v-else class="ml-auto shrink-0 p-1">
                    <LucideCirclePlus class="size-4" />
                  </span>
                </Button>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  </div>
</template>
