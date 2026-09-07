<script setup lang="ts">
/**
 * The whole-upload product-linking control shown above the manage-step file
 * list: a checkbox to auto-link images to products. Writes straight into the
 * shared wizard state ({@link useUploadWizardContext}); the match itself —
 * against a product's article number or id — is resolved by
 * {@link useProductMatch} in the rows and the review step.
 */
const { linkProducts } = useUploadWizardContext();
</script>

<template>
  <label
    class="flex cursor-pointer items-start gap-2.5 rounded-lg border px-4 py-3"
  >
    <Checkbox
      :model-value="linkProducts"
      class="mt-0.5"
      @update:model-value="(v) => (linkProducts = !!v)"
    />
    <span class="grid gap-0.5">
      <span class="text-sm font-medium">
        {{ $t('asset_library.link_products') }}
      </span>
      <span class="text-muted-foreground text-xs">
        {{ $t('asset_library.link_products_hint') }}
      </span>
    </span>
  </label>
</template>
