<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';
import type { Address, QuotationAddress } from '#shared/types';

const props = defineProps<{
  company: CustomerCompany | undefined;
  availableSalesReps: User[];
  availableBuyers: CompanyBuyer[];
  currentOwnerId: string;
  currentBuyerId: string;
  currentBillingAddress?: QuotationAddress | null;
  currentShippingAddress?: QuotationAddress | null;
}>();

const emit = defineEmits<{
  (
    event: 'save',
    data: {
      ownerId: string;
      buyerId: string;
      billingAddressId: string;
      shippingAddressId: string;
    },
  ): void;
}>();

const open = ref(false);

// Local selections
const selectedOwnerId = ref('');
const selectedBuyerId = ref('');
const selectedBillingAddressId = ref('');
const selectedShippingAddressId = ref('');

// Filter addresses by type
const billingAddresses = computed(() => {
  if (!props.company?.addresses) return [];
  return props.company.addresses.filter(
    (a) => a.addressType === 'billing' || a.addressType === 'billingandshipping',
  );
});

const shippingAddresses = computed(() => {
  if (!props.company?.addresses) return [];
  return props.company.addresses.filter(
    (a) =>
      a.addressType === 'shipping' || a.addressType === 'billingandshipping',
  );
});

// Format address for display in select
const formatAddress = (address: Address) => {
  const parts = [
    address.addressLine1,
    address.zip,
    address.city,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
};

// Match current quotation address to a company address
const matchAddress = (
  quotationAddr: QuotationAddress | null | undefined,
  companyAddresses: Address[],
): string => {
  if (!quotationAddr || companyAddresses.length === 0) return '';
  const match = companyAddresses.find(
    (a) =>
      a.addressLine1 === quotationAddr.address1 &&
      a.zip === quotationAddr.zip &&
      a.city === quotationAddr.city,
  );
  return match?._id || '';
};

// Sync current values when panel opens
watch(open, (value) => {
  if (value) {
    selectedOwnerId.value = props.currentOwnerId || '';
    selectedBuyerId.value = props.currentBuyerId || '';
    selectedBillingAddressId.value = matchAddress(
      props.currentBillingAddress,
      billingAddresses.value,
    );
    selectedShippingAddressId.value = matchAddress(
      props.currentShippingAddress,
      shippingAddresses.value,
    );
  }
});

const handleSave = () => {
  emit('save', {
    ownerId: selectedOwnerId.value,
    buyerId: selectedBuyerId.value,
    billingAddressId: selectedBillingAddressId.value,
    shippingAddressId: selectedShippingAddressId.value,
  });
  open.value = false;
};

const handleCancel = () => {
  open.value = false;
};
</script>

<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>{{ $t('orders.change_customer_details') }}</SheetTitle>
        <VisuallyHidden>
          <SheetDescription>
            {{ $t('orders.change_customer_details') }}
          </SheetDescription>
        </VisuallyHidden>
      </SheetHeader>
      <SheetBody class="h-full">
        <div class="space-y-6">
          <!-- Quotation Owner -->
          <div class="space-y-2">
            <label class="text-sm font-medium">
              {{ $t('orders.quotation_owner') }}
            </label>
            <Select v-model="selectedOwnerId">
              <SelectTrigger>
                <SelectValue
                  :placeholder="
                    $t('select_entity', {
                      entityName: $t('orders.quotation_owner').toLowerCase(),
                    })
                  "
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="user in availableSalesReps"
                  :key="user._id"
                  :value="user._id"
                >
                  {{ user.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Buyer -->
          <div class="space-y-2">
            <label class="text-sm font-medium">
              {{ $t('buyer') }}
            </label>
            <Select v-model="selectedBuyerId">
              <SelectTrigger>
                <SelectValue
                  :placeholder="
                    $t('select_entity', {
                      entityName: $t('buyer').toLowerCase(),
                    })
                  "
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="buyer in availableBuyers"
                  :key="buyer._id"
                  :value="buyer._id"
                >
                  {{ buyer.firstName }} {{ buyer.lastName }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Billing Address -->
          <div class="space-y-2">
            <label class="text-sm font-medium">
              {{ $t('billing_address') }}
            </label>
            <Select v-model="selectedBillingAddressId">
              <SelectTrigger>
                <SelectValue
                  :placeholder="
                    $t('select_entity', {
                      entityName: $t('billing_address').toLowerCase(),
                    })
                  "
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="address in billingAddresses"
                  :key="address._id"
                  :value="address._id"
                >
                  {{ formatAddress(address) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Shipping Address -->
          <div class="space-y-2">
            <label class="text-sm font-medium">
              {{ $t('shipping_address') }}
            </label>
            <Select v-model="selectedShippingAddressId">
              <SelectTrigger>
                <SelectValue
                  :placeholder="
                    $t('select_entity', {
                      entityName: $t('shipping_address').toLowerCase(),
                    })
                  "
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="address in shippingAddresses"
                  :key="address._id"
                  :value="address._id"
                >
                  {{ formatAddress(address) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('cancel') }}
        </Button>
        <Button @click="handleSave">
          {{ $t('save') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
