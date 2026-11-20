<script setup lang="ts">
/**
 * The whole-upload order-linking control under the product-linking one in the
 * manage step: a checkbox to link every file to one order, and, once on, an
 * [OrderLookup](/components/order/OrderLookup) to find it. The order rides
 * each file's ticket claim as an `orderfile` link, so it is linked when the
 * upload completes. On without an order found holds the step.
 */
const { linkToOrder, linkOrder } = useUploadWizardContext();
</script>

<template>
  <div class="rounded-lg border px-4 py-3">
    <label class="flex cursor-pointer items-start gap-2.5">
      <Checkbox
        :model-value="linkToOrder"
        class="mt-0.5"
        data-test="wizard-link-order"
        @update:model-value="(v) => (linkToOrder = !!v)"
      />
      <span class="grid gap-0.5">
        <span class="text-sm font-medium">
          {{ $t('asset_library.link_upload_to_order') }}
        </span>
        <span class="text-muted-foreground text-xs">
          {{ $t('asset_library.link_upload_to_order_hint') }}
        </span>
      </span>
    </label>
    <OrderLookup v-if="linkToOrder" v-model="linkOrder" class="mt-3" />
  </div>
</template>
