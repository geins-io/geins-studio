<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';
import type { Address } from '#shared/types';

const props = defineProps<{
  company: CustomerCompany | undefined;
  availableSalesReps: User[];
  availableBuyers: CompanyBuyer[];
  currentOwnerId: string;
  currentBuyerId: string;
  currentBillingAddressId?: string;
  currentShippingAddressId?: string;
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

const { getCountryNameById } = useAccountStore();
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
    (a) =>
      a.addressType === 'billing' || a.addressType === 'billingandshipping',
  );
});

const shippingAddresses = computed(() => {
  if (!props.company?.addresses) return [];
  return props.company.addresses.filter(
    (a) =>
      a.addressType === 'shipping' || a.addressType === 'billingandshipping',
  );
});

// Format address as single-line summary (used for select trigger display)
const formatAddressOneLine = (address: Address) => {
  const parts = [
    address.addressLine1,
    address.zip,
    address.city,
    address.country ? getCountryNameById(address.country) : undefined,
  ].filter(Boolean);
  return parts.join(', ');
};

// Sync current values when panel opens
watch(open, (value) => {
  if (value) {
    selectedOwnerId.value = props.currentOwnerId || '';
    selectedBuyerId.value = props.currentBuyerId || '';
    selectedBillingAddressId.value = props.currentBillingAddressId || '';
    selectedShippingAddressId.value = props.currentShippingAddressId || '';
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
    <SheetContent width="narrow">
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
            <Label>{{ $t('orders.quotation_owner') }}</Label>
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
            <Label>{{ $t('buyer') }}</Label>
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
            <Label>{{ $t('billing_address') }}</Label>
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
                  {{ formatAddressOneLine(address) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Shipping Address -->
          <div class="space-y-2">
            <Label>{{ $t('shipping_address') }}</Label>
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
                  {{ formatAddressOneLine(address) }}
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
