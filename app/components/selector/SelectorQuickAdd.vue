<script setup lang="ts">
const props = defineProps<{
  entities: Entity[];
  selection: SelectorSelection;
  entityName: string;
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

const { t } = useI18n();
const entityNamePlural = t(props.entityName, 2);
</script>
<template>
  <Command class="relative overflow-visible">
    <CommandInput
      :placeholder="$t('quick_add_entity', { entityName: entityNamePlural })"
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
      <CommandEmpty>{{
        $t('no_entities_found', { entityName: entityNamePlural })
      }}</CommandEmpty>
      <CommandGroup
        :heading="$t('entity_caps', { entityName }, 2)"
        :class="`${entities.length ? '!block' : ''}`"
      >
        <CommandItem
          v-for="entity in entities"
          :key="entity.id"
          :value="entity.id + ' ' + entity.name"
          class="pr-0 data-[highlighted]:bg-card"
        >
          <div class="flex w-full items-center gap-3 text-xs">
            <img
              v-if="entity.image"
              :src="entity.image"
              alt="entity image"
              class="size-6 shrink-0 rounded-lg"
            />
            <strong>{{ entity.id }}</strong>
            <span class="truncate">{{ entity.name || entity.title }}</span>
            <Button
              v-if="!isSelected(entity.id)"
              class="ml-auto shrink-0 p-1"
              variant="ghost"
              size="icon"
              @click="addItem(entity.id)"
            >
              <LucideCirclePlus class="size-4" />
            </Button>
            <Button
              v-else
              class="ml-auto shrink-0 p-1"
              variant="ghost"
              size="icon"
              @click="removeItem(entity.id)"
            >
              <LucideCircleCheck class="size-4 text-positive" />
            </Button>
          </div>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</template>
