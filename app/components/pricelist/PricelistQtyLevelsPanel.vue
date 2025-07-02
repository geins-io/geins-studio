<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    rules: PricelistRule[];
    productId: string;
    currency?: string;
  }>(),
  {},
);

const open = defineModel<boolean>('open');
const propRules = toRef(props, 'rules');

const globalRules = computed(() => {
  return props.rules.filter((rule: PricelistRule) => rule.global);
});
const productRules = computed(() => {
  return props.rules.filter((rule: PricelistRule) => !rule.global);
});

const editableRules = ref<PricelistRule[]>(productRules.value);

watch(propRules, (newRules) => {
  editableRules.value = newRules.filter((rule: PricelistRule) => !rule.global);
});

const emit = defineEmits<{
  (e: 'save', rules: PricelistRule[]): void;
}>();

const handleCancel = () => {
  open.value = false;
};
const handleSave = () => {
  open.value = false;
  const rulesToSave = [...globalRules.value, ...editableRules.value];
  emit('save', rulesToSave);
};
</script>
<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>Quantity levels</SheetTitle>
        <SheetDescription>
          Add quantity based price rules for this product.
        </SheetDescription>
      </SheetHeader>
      <div class="p-6">
        <ContentCardHeader
          size="sm"
          title="Global quantity levels"
          description="These price rules are applied globally to all products"
          class="mb-4"
        />
        <PricelistRules
          :rules="globalRules"
          :disabled="true"
          mode="price"
          :currency="currency"
        />
        <ContentCardHeader
          size="sm"
          title="Product quantity levels"
          description="These price rules are applied only to this product. If you add a rule with the same quantity as a global rule, the global rule will be overridden."
          class="mb-4 mt-6"
        />
        <PricelistRules
          :rules="productRules"
          :product-id="props.productId"
          mode="price"
          :currency="currency"
          @update="editableRules = $event"
        />
      </div>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ $t('cancel') }}
        </Button>
        <Button @click.stop="handleSave"> Apply </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
