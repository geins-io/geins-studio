<script setup lang="ts">
navigateTo('/account/profile');
// import type { ColumnDef } from '@tanstack/vue-table';
// import type { ColumnOptions, User } from '#shared/types';
// type Entity = User;

// const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();

// definePageMeta({
//   pageType: 'list',
// });

// // GLOBAL SETUP
// // const apiEndpoint = '/users';
// const dataList = ref<Entity[]>([]);
// const entityName = getEntityName();
// const newEntityUrl = getEntityNewUrl();
// const entityUrl = getEntityUrl('{id}');
// const loading = ref(true);
// const columns: Ref<ColumnDef<Entity>[]> = ref([]);

// // SET UP COLUMNS FOR ENTITY
// const columnOptions: ColumnOptions<Entity> = {
//   columnTypes: { email: 'link' },
//   linkColumns: {
//     email: {
//       url: entityUrl,
//       idField: '_id',
//     },
//   },
// };

// // FETCH DATA FOR ENTITY
// const { user } = useUserStore();

// if (user) {
//   dataList.value = [user];
// } else {
//   dataList.value = [];
// }

// loading.value = false;

// // GET AND SET COLUMNS
// const { getColumns } = useColumns<Entity>();
// columns.value = getColumns(dataList.value, columnOptions);
</script>

<template>
  <div>
    <!-- TODO: Implement user list -->
  </div>
</template>
