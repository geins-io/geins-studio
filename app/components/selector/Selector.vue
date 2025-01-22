<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';

// PROPS
const props = withDefaults(
  defineProps<{
    entities: Entity[];
    entityName?: string;
    mode?: SelectorMode;
  }>(),
  {
    entityName: 'product',
    mode: 'advanced',
  },
);

// TWO-WAY BINDING FOR SELECTION VIA V-MODEL
const selection = defineModel<SelectorSelectionBase>('selection', {
  required: true,
});

// GLOBALS
const entities = ref(props.entities);
const { defaultCurrency } = useAccountStore();
const { toast } = useToast();
const { t } = useI18n();
const { getFallbackSelection } = useSelector();

// SETUP REFS FOR INCLUDE/EXCLUDE SELECTION
const includeSelection = ref<SelectorSelection>(
  selection.value.include?.[0]?.selections?.[0] || getFallbackSelection(),
);
const excludeSelection = ref<SelectorSelection>(
  selection.value.exclude?.[0]?.selections?.[0] || getFallbackSelection(),
);
const showExclude = ref(!!excludeSelection.value.ids?.length);

// WATCH AND UPDATE SELECTION ON INCLUDE/EXCLUDE SELECTION CHANGE
watch(
  () => includeSelection.value,
  (value) => {
    selection.value.include = [{ selections: [value] }];
  },
);
watch(
  () => excludeSelection.value,
  (value) => {
    showExclude.value = !!value.ids?.length;
    selection.value.exclude = [{ selections: [value] }];
  },
);
watch(
  () => showExclude.value,
  (value) => {
    if (!value) {
      excludeSelection.value = getFallbackSelection();
    }
    if (!value && selection.value.exclude?.length) {
      showExclude.value = true;
    }
  },
);

// HANDLERS FOR MANUALLY SELECTED ENTITIES
const addToManuallySelected = (id: number) => {
  includeSelection.value?.ids?.push(id);
  toast({
    title: t('entity_with_id_added_to_selection', {
      entityName: props.entityName,
      id,
    }),
    variant: 'positive',
  });
};
const removeFromManuallySelected = (id: number) => {
  includeSelection.value?.ids?.splice(
    includeSelection.value?.ids?.indexOf(id),
    1,
  );
};

// SETUP TABLE FOR SELECTED ENTITIES
const { getColumns, orderAndFilterColumns } = useColumns();
let columns = getColumns(entities.value);
columns = orderAndFilterColumns(columns, ['id', 'image', 'name', 'price']);

const selectedEntities = computed(() => {
  const included = entities.value.filter((entity) =>
    includeSelection.value?.ids?.includes(entity.id),
  );
  const excludedIds = excludeSelection.value?.ids || [];
  const selected = included.filter(
    (entity) => !excludedIds.includes(entity.id),
  );
  return selected.length ? selected : entities.value;
});
</script>
<template>
  <div>
    <div class="mb-6 flex items-start justify-between">
      <slot name="header">
        <SelectorHeader
          :entities="entities"
          :entity-name="entityName"
          :selection="includeSelection"
          :title="t('entity_selection', { entityName })"
          :description="t('selector_include_description')"
          @add="addToManuallySelected($event)"
          @remove="removeFromManuallySelected($event)"
        />
      </slot>
    </div>
    <div>
      <div class="mb-4 space-y-4">
        <slot name="selection">
          <SelectorSelection
            v-model:selection="includeSelection"
            type="include"
            :mode="mode"
            :currency="defaultCurrency"
            :entity-name="entityName"
            :entities="entities"
          />
          <ContentSwitch
            :label="$t('exclude_entities_from_selection', { entityName }, 2)"
            :description="$t('selector_exclude_description')"
            :checked="showExclude"
            @update:checked="showExclude = $event"
          >
            <SelectorSelection
              v-model:selection="excludeSelection"
              type="exclude"
              :mode="mode"
              :currency="defaultCurrency"
              :entity-name="entityName"
              :entities="entities"
            />
          </ContentSwitch>
        </slot>
      </div>
      <slot />
      <slot name="list">
        <ContentHeading>
          {{ $t('selected_entities', { entityName }, 2) }}
        </ContentHeading>
        <TableView
          :columns="columns"
          :data="selectedEntities"
          :entity-name="entityName"
          :mode="mode"
          :page-size="15"
        />
      </slot>
    </div>
  </div>
</template>
