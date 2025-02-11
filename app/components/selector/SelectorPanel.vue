<script setup lang="ts">
import { SelectorMode, SelectorSelectionType } from '#shared/types';

// PROPS
const props = withDefaults(
  defineProps<{
    selection: SelectorSelection;
    mode: SelectorMode;
    currency?: string;
    type?: SelectorSelectionType;
    options: SelectorSelectionOption[];
    entityName: string;
    entities: Entity[];
  }>(),
  {
    type: SelectorSelectionType.Include,
  },
);

// EMITS
const emit = defineEmits<{
  (event: 'save', selection: SelectorSelection): void;
}>();

// GLOBALS
const { t } = useI18n();
const entityName = toRef(props, 'entityName');
const entities = toRef(props, 'entities');
const type = toRef(props, 'type');
const currency = toRef(props, 'currency');
const mode = toRef(props, 'mode');
const entityIsProduct = computed(() => entityName.value === 'product');
const currentSelection = ref<SelectorSelection>(
  toRef(props, 'selection').value,
);

// WATCH AND KEEP SELECTION IN SYNC
watch(
  () => props.selection,
  (value) => {
    currentSelection.value = value;
  },
  { deep: true },
);

const options = toRef(props, 'options');
const currentOption = ref(options.value?.[0]?.id ?? '');
//watch options and set new current option to the first if changed
watch(
  options,
  (value) => {
    currentOption.value = value?.[0]?.id ?? '';
  },
  { deep: true },
);
const currentSelectionGroup = computed(
  () => options.value.find((o) => o.id === currentOption.value)?.group || 'ids',
);
const selectedEntities = computed(() =>
  entities.value.filter((e) => currentSelection.value.ids?.includes(e.id)),
);
const selectedIds = computed(() => currentSelection.value.ids);

const selectOption = (id: SelectorSelectionOptionsId) => {
  currentOption.value = id;
};

const { getColumns, orderAndFilterColumns } = useColumns();
const columnOptions: ColumnOptions<Product> = {
  selectable: true,
};
let columns = getColumns(entities.value, columnOptions);

if (entityIsProduct.value) {
  columns = orderAndFilterColumns(columns, [
    'select',
    'id',
    'image',
    'name',
    'price',
  ]);
}

// watch entitites, if they change, update columns
watch(entities, () => {
  columns = getColumns(entities.value, columnOptions);
  if (entityIsProduct.value) {
    columns = orderAndFilterColumns(columns, [
      'select',
      'id',
      'image',
      'name',
      'price',
    ]);
  }
});

const onSelection = (selection: { id?: number }[]) => {
  const ids = selection.map((s) => s.id);
  currentSelection.value = {
    ...currentSelection.value,
    [currentSelectionGroup.value]: ids,
  };
};
const removeSelected = (id: number) => {
  currentSelection.value = {
    ...currentSelection.value,
    [currentSelectionGroup.value]: currentSelection.value.ids?.filter(
      (i) => i !== id,
    ),
  };
};

const handleSave = () => {
  emit('save', currentSelection.value);
};
const handleCancel = () => {
  currentSelection.value = props.selection;
};
</script>
<template>
  <Sheet>
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="wide">
      <SheetHeader>
        <SheetTitle>{{ t('entity_selection', { entityName }) }}</SheetTitle>
        <SheetDescription>
          {{ t('selector_panel_description') }}
        </SheetDescription>
      </SheetHeader>
      <div class="flex h-[calc(100vh-10.1rem)] grid-cols-12">
        <div class="w-[170px] shrink-0 px-4 py-3">
          <ContentHeading>{{ t('select_from') }}</ContentHeading>
          <SidebarNav>
            <SidebarNavItem
              v-for="option in options"
              :id="option.id"
              :key="option.id"
              :current="option.id === currentOption"
              @click="selectOption(option.id)"
            >
              {{ option.label }}
            </SidebarNavItem>
          </SidebarNav>
        </div>
        <div class="w-full border-x px-4 py-3">
          <ContentHeading>{{ t('select') }}</ContentHeading>
          <!-- PRODUCT -->
          <div v-if="currentSelectionGroup === 'ids'">
            <TableView
              :columns="columns"
              :data="entities"
              :entity-name="entityName"
              :show-search="true"
              :pinned-state="{}"
              :selected-ids="selectedIds"
              max-height="calc(100vh - 20rem)"
              mode="simple"
              @selection="onSelection"
            />
          </div>
          <!-- END PRODUCT -->
        </div>
        <div class="h-full w-80 shrink-0 px-4 py-3">
          <ContentHeading>{{ t('selected') }}</ContentHeading>
          <!-- IDS -->
          <ul
            v-if="currentSelectionGroup === 'ids'"
            class="h-[calc(100%-26px)] overflow-auto"
          >
            <li
              v-for="entity in selectedEntities"
              :key="entity.id"
              class="flex items-center gap-2.5 py-1.5 text-xs"
            >
              <span class="font-semibold">{{ entity.id }}</span>
              <span class="truncate">{{ entity.name }}</span>
              <Button
                size="icon"
                variant="outline"
                class="ml-auto mr-1 size-5 shrink-0 hover:text-negative"
                @click="removeSelected(entity.id)"
              >
                <LucideX class="size-3" />
              </Button>
            </li>
          </ul>
          <!-- END IDS -->
        </div>
      </div>
      <SheetBody>
        <SheetFooter>
          <SheetClose as-child>
            <Button variant="outline" @click="handleCancel">
              {{ t('cancel') }}
            </Button>
          </SheetClose>
          <SheetClose as-child>
            <Button @click="handleSave">
              {{ t('add_selected') }}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetBody>
    </SheetContent>
  </Sheet>
</template>
