<script setup lang="ts">
import type {
  ColumnOptions,
  StringKeyOf,
  WholesaleAccountList,
} from '#shared/types';
type Entity = WholesaleAccount;
type EntityList = WholesaleAccountList;

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
const responseList = ref<Entity[]>([]);
const dataList = ref<EntityList[]>([]);
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
    statusMessage: t('failed_to_fetch_entity', { entityName }, 2),
  });
} else {
  responseList.value = data.value as Entity[];
}
loading.value = false;

// MODIFY DATA
dataList.value = responseList.value.map((account) => {
  const groups: string[] = [];
  const salesReps: string[] = [];

  for (let i = account.tags.length - 1; i >= 0; i--) {
    if (account.tags[i]?.includes('group:')) {
      const tag = account.tags[i] || '';
      groups.push(tag.replace('group:', ''));
      account.tags.splice(i, 1);
    }
  }

  account.salesReps.forEach((salesRep) => {
    const firstName = salesRep?.firstName;
    const lastName = salesRep?.lastName;
    const fullName = `${firstName} ${lastName}`;
    salesReps.push(fullName);
  });

  return {
    ...account,
    groups,
    salesReps,
  };
});

// SET UP COLUMN OPTIONS FOR ENTITY
const columnOptions: ColumnOptions<EntityList> = {
  entityLinkUrl: entityUrl,
  columnTypes: { name: 'entity-link' },
  columnTitles: { salesReps: 'Sales reps' },
  excludeColumns: ['meta', 'addresses', 'buyers'],
};
// GET AND SET COLUMNS
const { getColumns } = useColumns<EntityList>();
const columns = getColumns(dataList.value, columnOptions);

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['externalId'];
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
