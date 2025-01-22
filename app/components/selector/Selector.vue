<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';

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

const { getFallbackSelection } = useSelector();

const selection = defineModel<SelectorSelectionBase>('selection', {
  required: true,
});

const entities = ref(props.entities);
const { defaultCurrency } = useAccountStore();
const { toast } = useToast();
const { t } = useI18n();

const includeSelection = ref<SelectorSelection>(
  selection.value.include?.[0]?.selections?.[0] || getFallbackSelection(),
);
const excludeSelection = ref<SelectorSelection>(
  selection.value.exclude?.[0]?.selections?.[0] || getFallbackSelection(),
);

watch(
  () => includeSelection.value,
  (value) => {
    selection.value.include = [{ selections: [value] }];
  },
);
watch(
  () => excludeSelection.value,
  (value) => {
    selection.value.exclude = [{ selections: [value] }];
  },
);

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

const { getColumns } = useColumns();
const columns = getColumns(entities.value);

const selectedEntities = computed(() => {
  const selected = entities.value.filter((entity) =>
    includeSelection.value?.ids?.includes(entity.id),
  );
  return selected.length ? selected : entities.value;
});

const shouldExclude = ref(false);
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
            type="include"
            :mode="mode"
            :selection="includeSelection"
            :currency="defaultCurrency"
            :entity-name="entityName"
            :entities="entities"
          />
          <ContentSwitch
            :label="$t('exclude_entities_from_selection', { entityName }, 2)"
            :description="$t('selector_exclude_description')"
            :checked="shouldExclude"
            @update:checked="shouldExclude = $event"
          >
            <SelectorSelection
              type="exclude"
              :mode="mode"
              :selection="excludeSelection"
              :currency="defaultCurrency"
              :entity-name="entityName"
              :entities="entities"
            />
          </ContentSwitch>
        </slot>
      </div>
      <slot />
      <slot name="list">
        <TableView
          :columns="columns"
          :data="selectedEntities"
          :entity-name="entityName"
          :mode="mode"
        />
      </slot>
    </div>
  </div>
</template>
