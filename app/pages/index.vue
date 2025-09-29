<script setup lang="ts">
import { TableMode, type WholesaleAccount } from '#shared/types';

definePageMeta({
  layout: 'default',
  title: 'Welcome to Geins Studio',
});

// const { wholesaleApi } = useGeinsRepository();
// const { ordersList, orderColumns, fetchOrders } = useWholesaleOrders();

// const {
//   data: allAccounts,
//   error,
//   refresh,
// } = await useAsyncData<WholesaleAccount[]>('wholesale-accounts', () =>
//   wholesaleApi.account.list({ fields: ['salesreps', 'buyers'] }),
// );

// if (!allAccounts.value || error.value) {
//   allAccounts.value = [];
// }

// if (allAccounts.value.length === 0) {
//   ordersList.value = [];
// } else {
//   const orderSelectionQuery: OrderBatchQuery = {
//     include: [
//       {
//         selections: [
//           {
//             condition: SelectorCondition.And,
//             wholesaleAccountIds: allAccounts.value.map(
//               (account) => account._id,
//             ),
//           },
//         ],
//       },
//     ],
//   };
//   // Initial fetch of orders
//   await fetchOrders(
//     orderSelectionQuery,
//     undefined,
//     undefined,
//     undefined,
//     allAccounts.value,
//   );

//   // Order ordersList by dateCreated descending
//   ordersList.value.sort((a, b) => {
//     return new Date(b.created).getTime() - new Date(a.created).getTime();
//   });
// }

const breadcrumbsStore = useBreadcrumbsStore();
breadcrumbsStore.setShowBreadcrumbs(false);
</script>

<template>
  <div class="max-w-full sm:p-4">
    <ContentHeader title="Welcome to Geins Studio" />

    <!-- Main content area -->
    <div class="space-y-8">
      <!-- Wholesale quick access section -->
      <div>
        <div class="mt-6 mb-6 sm:mt-10">
          <ContentCardHeader
            title="Wholesale - Quick Access"
            description="Quick access to key wholesale features like account management, pricing, and product access."
            size="md"
          />
        </div>

        <!-- Quick access cards grid -->
        <div class="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @6xl:grid-cols-4">
          <ContentLinkCard
            title="Create a new account"
            description="Manage existing wholesale accounts"
            link="/wholesale/account/new"
            linkType="create"
          />

          <!-- Accounts card -->
          <ContentLinkCard
            title="Accounts"
            description="Manage existing wholesale accounts"
            link="/wholesale/account/list"
            linkType="list"
          />

          <!-- Create a new pricelist card -->
          <ContentLinkCard
            title="Create a new pricelist"
            description="Manage existing wholesale accounts"
            link="/wholesale/pricelist/new"
            linkType="create"
          />

          <!-- Pricelists card -->
          <ContentLinkCard
            title="Pricelists"
            description="Manage existing wholesale accounts"
            link="/wholesale/pricelist/list"
            linkType="list"
          />
        </div>
      </div>

      <!-- Latest Wholesale orders section -->
      <!-- <div>
        <div class="mt-10 mb-6">
          <ContentCardHeader
            title="Latest wholesale orders"
            description="The most recent orders placed by buyers linked to a wholesale account."
            size="md"
          />
        </div>
        <TableView
          :columns="orderColumns"
          :data="ordersList"
          entity-name="order"
          :page-size="10"
          :mode="TableMode.Simple"
        />
      </div> -->
    </div>
  </div>
</template>
