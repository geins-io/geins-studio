<script setup lang="ts">
import type {
  ChannelListItem,
  ChannelList,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

type Entity = ChannelListItem;
type EntityList = ChannelList;

const scope = 'pages/settings/channel/list.vue';
const { t } = useI18n();
const { getEntityUrlFor } = useEntityUrl();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { channelApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityName = 'channel';
const entityIdentifier = '{id}';
const entityUrl = getEntityUrlFor('channel', 'settings', entityIdentifier);
const newEntityUrl = '/settings/channel/new';
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

usePageError({
  entityName,
  entityList: true,
  scope,
});
const fetchError = ref(false);

// Transform API response to table display format
const mapToListData = (list: Entity[]): EntityList[] => {
  return list.map((channel) => {
    const { markets: rawMarkets, languages: rawLanguages, ...rest } = channel;
    return {
      ...rest,
      markets: createTooltip({
        items: rawMarkets,
        entityName: 'market',
        formatter: (m) => m.country.name,
        t,
      }),
      languages: createTooltip({
        items: rawLanguages,
        entityName: 'language',
        formatter: (l) => l.name,
        t,
      }),
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(
  'settings-channels-list',
  () => channelApi.channel.list(),
);

const { getColumns, addActionsColumn } = useColumns<EntityList>();

onMounted(() => {
  watch(
    [data, error],
    ([newData, newError]) => {
      if (newError) {
        fetchError.value = true;
        dataList.value = [];
        return;
      }
      fetchError.value = false;
      if (newData) {
        dataList.value = mapToListData(newData);
      }
    },
    { immediate: true },
  );

  // SET UP COLUMN OPTIONS FOR ENTITY
  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      displayName: 'link',
      markets: 'tooltip',
      languages: 'tooltip',
      url: 'link',
      active: 'status',
    },
    linkColumns: {
      displayName: { url: entityUrl, idField: '_id' },
      url: { useValueAsUrl: true, external: true },
    },
    columnTitles: {
      displayName: t('channels.display_name'),
      active: t('status'),
      markets: t('channels.markets_count'),
      languages: t('channels.languages_count'),
    },
    excludeColumns: [
      'channelType',
      'defaultLanguage',
      'defaultMarket',
      'languageCount',
      'marketCount',
      'locked',
    ],
  };

  // GET AND SET COLUMNS
  columns.value = getColumns(dataList.value, columnOptions);

  addActionsColumn(
    columns.value,
    {
      onEdit: (item: EntityList) =>
        navigateTo(entityUrl.replace(entityIdentifier, String(item._id))),
    },
    'actions',
    ['edit'],
  );
  loading.value = false;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = ['_id'];
visibilityState.value = getVisibilityState(hiddenColumns);
</script>

<template>
  <ContentHeader :title="$t('navigation.channels')">
    <ContentActionBar>
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
      :error="fetchError"
      :on-retry="refresh"
    >
      <template #empty-actions>
        <ButtonIcon
          icon="new"
          variant="secondary"
          @click="navigateTo(newEntityUrl)"
        >
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
