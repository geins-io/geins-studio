<script setup lang="ts">
// PROPS
const props = withDefaults(
  defineProps<{
    selection: SelectorSelection;
    mode: SelectorMode;
    currency?: string;
    type?: SelectorSelectionType;
    options?: SelectorSelectionOption[];
    entityName: string;
    entities: Entity[];
  }>(),
  {
    type: 'include',
    options: () => [
      {
        id: 'product',
        group: 'ids',
        type: 'multiple',
      },
      {
        id: 'entity',
        group: 'ids',
        type: 'multiple',
      },
      {
        id: 'category',
        group: 'categories',
        type: 'multiple',
      },
      {
        id: 'brand',
        group: 'brands',
        type: 'multiple',
      },
      {
        id: 'price',
        group: 'price',
        type: 'single',
      },
      {
        id: 'stock',
        group: 'stock',
        type: 'single',
      },
      {
        id: 'import',
        group: 'ids',
        type: 'single',
      },
    ],
  },
);

// EMITS
const emit = defineEmits<{
  (event: 'save', selection: SelectorSelection): void;
}>();

// GLOBALS
const { t } = useI18n();
const entityIsProduct = ref(props.entityName === 'product');
const currentSelection = ref<SelectorSelection>(props.selection);
// WATCH AND KEEP SELECTION IN SYNC
watch(
  () => props.selection,
  (value) => {
    currentSelection.value = value;
  },
  { deep: true },
);

// SETUP OPTIONS
// Filter based on mode
const options = ref(
  props.mode === 'simple'
    ? props.options.filter((o) => {
        const idToKeep = entityIsProduct.value ? 'product' : 'entity';
        return o.id === idToKeep;
      })
    : props.options.filter((o) => {
        const idToRemove = entityIsProduct.value ? 'entity' : 'product';
        return o.id !== idToRemove;
      }),
);
// Set labels from lang keys
options.value = options.value.map((o) => {
  if (o.id === 'entity' || o.id === 'product') {
    o.label = t('entity_caps', { entityName: props.entityName }, 2);
  } else {
    const pluralization = o.type === 'multiple' ? 2 : 1;
    o.label = t(`selector_option_${o.id}`, pluralization);
  }
  return o;
});

const currentOption = ref(options.value?.[0]?.id ?? '');
const currentSelectionGroup = computed(
  () => options.value.find((o) => o.id === currentOption.value)?.group || 'ids',
);
const selectedEntities = computed(() =>
  props.entities.filter((e) => currentSelection.value.ids?.includes(e.id)),
);
const selectedIds = computed(() => currentSelection.value.ids);

const selectOption = (id: SelectorSelectionOptionsId) => {
  currentOption.value = id;
};

const { getColumns, orderAndFilterColumns } = useColumns();
const columnOptions: ColumnOptions<Product> = {
  selectable: true,
};
let columns = getColumns(props.entities, columnOptions);
columns = orderAndFilterColumns(columns, [
  'select',
  'id',
  'image',
  'name',
  'price',
]);

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
      <div class="grid h-full grid-cols-12 rounded-lg border">
        <div class="col-span-2 flex flex-col p-2">
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
        <div class="col-span-8 flex flex-col border-x p-2">
          <ContentHeading>{{ t('select') }}</ContentHeading>
          <!-- PRODUCT -->
          <div v-if="currentOption === 'product'">
            <TableView
              :columns="columns"
              :data="entities"
              :entity-name="entityName"
              :page-size="20"
              :show-search="true"
              :pinned-state="{}"
              :selected-ids="selectedIds"
              max-height="calc(100vh - 26rem)"
              mode="simple"
              @selection="onSelection"
            />
          </div>
          <!-- END PRODUCT -->
        </div>
        <div class="col-span-2 flex flex-col p-2">
          <ContentHeading>{{ t('selected') }}</ContentHeading>
          <!-- IDS -->
          <ul v-if="currentSelectionGroup === 'ids'">
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
                class="size-5 shrink-0"
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
