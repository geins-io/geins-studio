<script setup lang="ts" generic="T extends SelectorEntity">
const props = defineProps<{
  entities: T[];
  selection: SelectorSelection;
  entityName: string;
}>();

const focused = ref(false);
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
const handleOutsideClick = () => {
  focused.value = false;
};
const isSelected = (id: string) => {
  return props.selection.ids?.includes(id);
};
</script>
<template>
  <div v-click-outside="handleOutsideClick" class="w-full">
    <Command class="relative overflow-visible">
      <CommandInput
        :placeholder="$t('quick_add_entity', { entityName }, 2)"
        @focus="focused = true"
      />
      <CommandList
        :class="
          cn(
            'quick-search-results absolute left-0 top-9 z-50 w-full overflow-x-hidden rounded-b-lg border border-t-0 bg-card',
            `${focused ? '' : '!hidden'}`,
          )
        "
      >
        <CommandEmpty>{{
          $t('no_entity_found', { entityName }, 2)
        }}</CommandEmpty>
        <CommandGroup
          :heading="$t('entity_caps', { entityName }, 2)"
          :class="`${entities.length ? '!block' : ''}`"
        >
          <CommandItem
            v-for="entity in entities"
            :key="entity._id"
            :value="entity._id + ' ' + entity.name"
            class="data-[highlighted]:bg-card"
          >
            <div class="flex w-full items-center gap-3 text-xs">
              <img
                v-if="entity.image"
                :src="entity.image"
                alt="entity image"
                class="size-6 shrink-0 rounded-lg"
              />
              <strong>{{ entity._id }}</strong>
              <span class="truncate">{{ entity.name }}</span>
              <Button
                v-if="!isSelected(entity._id)"
                class="ml-auto shrink-0 p-1"
                variant="ghost"
                size="icon"
                @click="addItem(entity._id)"
              >
                <LucideCirclePlus class="size-4" />
              </Button>
              <Button
                v-else
                class="ml-auto shrink-0 p-1"
                variant="ghost"
                size="icon"
                @click="removeItem(entity._id)"
              >
                <LucideCircleCheck class="size-4 text-positive" />
              </Button>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>
</template>
