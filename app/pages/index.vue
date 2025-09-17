<script setup lang="ts">
import { TableMode, type WholesaleAccount } from '#shared/types';

definePageMeta({
  layout: 'default',
});

const { wholesaleApi } = useGeinsRepository();
const { ordersList, orderColumns, fetchOrders } = useWholesaleOrders();

const {
  data: allAccounts,
  error,
  refresh,
} = await useAsyncData<WholesaleAccount[]>('wholesale-accounts', () =>
  wholesaleApi.account.list({ fields: ['salesreps', 'buyers'] }),
);

if (!allAccounts.value || error.value) {
  allAccounts.value = [];
}

if (allAccounts.value.length === 0) {
  ordersList.value = [];
} else {
  const orderSelectionQuery: OrderBatchQuery = {
    include: [
      {
        selections: [
          {
            condition: SelectorCondition.And,
            wholesaleAccountIds: allAccounts.value.map(
              (account) => account._id,
            ),
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
    undefined,
    allAccounts.value,
  );
}
</script>

<template>
  <div class="max-w-full px-8 py-6">
    <ContentHeader
      title="Welcome to Geins Studio"
      description=""
      :show-breadcrumb="false"
    />

    <!-- Main content area -->
    <div class="space-y-8">
      <!-- Wholesale quick access section -->
      <div>
        <h2 class="mb-2 text-lg font-semibold">Wholesale Quick Access</h2>
        <p class="text-muted-foreground mb-6 text-sm">
          Quick access to key wholesale features like account management,
          pricing, and product permissions.
        </p>

        <!-- Quick access cards grid -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- Create a new account card -->
          <Card
            class="cursor-pointer p-6 transition-shadow hover:shadow-md"
            @click="$router.push('/wholesale/account/new')"
          >
            <CardHeader class="p-0">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-base">Create a new account</CardTitle>
                  <CardDescription class="text-sm">
                    Manage existing wholesale accounts
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <LucidePlus class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          <!-- Accounts card -->
          <Card
            class="cursor-pointer p-6 transition-shadow hover:shadow-md"
            @click="$router.push('/wholesale/account/list')"
          >
            <CardHeader class="p-0">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-base">Accounts</CardTitle>
                  <CardDescription class="text-sm">
                    Manage existing wholesale accounts
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <LucideChevronRight class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          <!-- Create a new pricelist card -->
          <Card
            class="cursor-pointer p-6 transition-shadow hover:shadow-md"
            @click="$router.push('/wholesale/pricelist/new')"
          >
            <CardHeader class="p-0">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-base"
                    >Create a new pricelist</CardTitle
                  >
                  <CardDescription class="text-sm">
                    Manage existing wholesale accounts
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <LucidePlus class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>

          <!-- Pricelists card -->
          <Card
            class="cursor-pointer p-6 transition-shadow hover:shadow-md"
            @click="$router.push('/wholesale/pricelist/list')"
          >
            <CardHeader class="p-0">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-base">Pricelists</CardTitle>
                  <CardDescription class="text-sm">
                    Manage existing wholesale accounts
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <LucideChevronRight class="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      <!-- Latest Wholesale orders section -->
      <div>
        <h2 class="mb-2 text-lg font-semibold">Latest Wholesale orders</h2>
        <p class="text-muted-foreground mb-6 text-sm">
          A summary of the 30 most recent orders placed by buyers linked to a
          wholesale account.
        </p>

        <!-- Orders Table -->
        <TableView
          :columns="orderColumns"
          :data="ordersList"
          entity-name="order"
          :page-size="10"
          :mode="TableMode.Simple"
        />
      </div>
    </div>
  </div>
</template>
