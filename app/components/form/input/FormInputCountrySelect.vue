<script setup lang="ts">
import { Check, ChevronsUpDown } from 'lucide-vue-next';

const _props = withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: '',
  },
);
const model = defineModel<string>({
  default: () => '',
});
console.log('🚀 ~ model:', model);

const accountStore = useAccountStore();
const { currentCountries } = storeToRefs(accountStore);

const countries = computed(() => {
  return currentCountries.value.map((country) => ({
    label: country?.name,
    value: country?._id,
  }));
});

const selectValue = (id: string | undefined) => {
  console.log('🚀 ~ selectValue ~ id:', id);
  model.value = id || '';
  console.log('🚀 ~ selectValue ~ model.value:', model.value);
};
</script>

<template>
  <Combobox by="label">
    <ComboboxAnchor as-child>
      <div class="relative w-full items-center rounded-lg border">
        <ComboboxInput
          :display-value="(val) => val?.label"
          placeholder="Select country..."
        />
        <ComboboxTrigger
          class="absolute inset-y-0 end-0 flex items-center justify-center px-3"
        >
          <ChevronsUpDown class="size-4 text-muted-foreground" />
        </ComboboxTrigger>
      </div>
    </ComboboxAnchor>

    <ComboboxList class="w-[--reka-popper-anchor-width]">
      <ComboboxEmpty> Nothing found. </ComboboxEmpty>

      <ComboboxGroup>
        <ComboboxItem
          v-for="country in countries"
          :key="country.value"
          :value="country"
          @select="selectValue(country.value)"
        >
          {{ country.label }}

          <ComboboxItemIndicator>
            <Check :class="cn('ml-auto size-4')" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </Combobox>
</template>
