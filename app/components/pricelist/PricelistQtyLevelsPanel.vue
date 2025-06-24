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
const rules = ref<PricelistRule[]>(props.rules);

watch(propRules, (newRules) => {
  rules.value = newRules;
});

const emit = defineEmits<{
  (e: 'save', rules: PricelistRule[]): void;
}>();

const handleCancel = () => {
  open.value = false;
};
const handleSave = () => {
  open.value = false;
  emit('save', rules.value);
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
          Add volume based price rules for the producyt. Margin and disocunt
          will be calculated basd on the set list price if no quantity break
          price is set.
        </SheetDescription>
      </SheetHeader>
      <div class="p-6">
        <PricelistRules
          :rules="rules"
          mode="price"
          :currency="currency"
          @update="rules = $event"
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
