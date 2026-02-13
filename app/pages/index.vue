<script setup lang="ts">
import { TableMode, type CustomerCompany } from '#shared/types';
import { LucidePackage } from '#components';

definePageMeta({
  layout: 'default',
  title: 'Welcome to Geins Studio',
});

const { customerApi } = useGeinsRepository();
const { ordersList, orderColumns, fetchOrders } = useCompanyOrders();

const { data: allCompanies, error } = await useAsyncData<CustomerCompany[]>(
  'customer-companies',
  () => customerApi.company.list({ fields: ['salesreps', 'buyers'] }),
);

if (!allCompanies.value || error.value) {
  allCompanies.value = [];
}

if (allCompanies.value.length === 0) {
  ordersList.value = [];
} else {
  const orderSelectionQuery: OrderBatchQuery = {
    include: [
      {
        selections: [
          {
            condition: SelectorCondition.And,
            orderTypes: ['wholesale'],
          },
        ],
      },
    ],
  };
  // Initial fetch of orders
  await fetchOrders(
    orderSelectionQuery,
    undefined,
    undefined,
    allCompanies.value,
  );

  // Order ordersList by dateCreated descending
  ordersList.value.sort((a, b) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });
}

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
            title="Quick access"
            description="Quick access company management, pricing, and product access."
            size="md"
          />
        </div>

        <!-- Quick access cards grid -->
        <div class="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @6xl:grid-cols-4">
          <ContentLinkCard
            title="Create a new company"
            description="Create a new company"
            link="/customers/company/new"
            link-type="create"
          />

          <!-- Companies card -->
          <ContentLinkCard
            title="Companies"
            description="Manage existing companies"
            link="/customers/company/list"
            link-type="list"
          />

          <!-- Create a new price list card -->
          <ContentLinkCard
            title="Create a new price list"
            description="Create a new price list"
            link="/pricing/price-list/new"
            link-type="create"
          />

          <!-- Price lists card -->
          <ContentLinkCard
            title="Price lists"
            description="Manage existing price lists"
            link="/pricing/price-list/list"
            link-type="list"
          />
        </div>
      </div>

      <!-- Latest Wholesale orders section -->
      <div>
        <div class="mt-10 mb-6">
          <ContentCardHeader
            title="Latest company orders"
            description="The most recent orders placed by buyers linked to a company."
            size="md"
          />
        </div>
        <TableView
          :columns="orderColumns"
          :data="ordersList"
          entity-name="order"
          :page-size="10"
          :mode="TableMode.Simple"
          :empty-icon="LucidePackage"
        />
      </div>
    </div>
  </div>
</template>
