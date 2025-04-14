<script setup lang="ts">
import type {
  ColumnOptions,
  StringKeyOf,
  WholesaleAccount,
} from '#shared/types';
type Entity = WholesaleAccount;

const { t } = useI18n();
const route = useRoute();
const { getEntityName, getNewEntityUrl, getEntityUrl } = useEntity(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const apiEndpoint = '/wholesale/account/list';
const dataList = ref<Entity[]>([]);
const entityIdentifier = '{_id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);

// FETCH DATA FOR ENTITY
const { data, error } = await useAPI<Entity[]>(apiEndpoint);

if (!data.value || error.value) {
  throw createError({
    ...error.value,
    statusMessage: t('failed_to_fetch_entitity', { entityName }, 2),
  });
} else {
  dataList.value = data.value as Entity[];
}
loading.value = false;

// MODIFY DATA
dataList.value = dataList.value.map((account) => {
  const groups = [];
  const salesReps: string[] = [];

  for (let i = account.tags.length - 1; i >= 0; i--) {
    if (account.tags[i]?.includes('group:')) {
      groups.push(account.tags[i]?.replace('group:', ''));
      account.tags.splice(i, 1);
    }
  }

  account.salesReps.forEach((salesRep) => {
    const firstName = salesRep?.firstName;
    const lastName = salesRep?.lastName;
    const fullName = `${firstName} ${lastName}`;
    salesReps.push(fullName);
    console.log('🚀 ~ account.salesReps.forEach ~ fullName:', fullName);
  });

  return {
    ...account,
    groups,
    salesRepsNames: salesReps,
  };
});

// SET UP COLUMN OPTIONS FOR ENTITY
const columnOptions: ColumnOptions<Entity> = {
  entityLinkUrl: entityUrl,
  columnTypes: { name: 'entity-link' },
  columnTitles: { salesRepsNames: 'Sales reps' },
  excludeColumns: ['meta', 'addresses', 'salesReps', 'buyers'],
};
// GET AND SET COLUMNS
const { getColumns } = useColumns<Entity>();
const columns = getColumns(dataList.value, columnOptions);

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<Entity>();
const hiddenColumns: StringKeyOf<Entity>[] = ['externalId'];
const visibilityState = getVisibilityState(hiddenColumns);
</script>

<template>
  <ContentHeader :title="$t('entity_caps', { entityName }, 2)">
    <ContentActionBar>
      <ButtonExport />
      <ButtonIcon icon="new" :href="newEntityUrl">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>
  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
    />
    <template #error="{ errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
