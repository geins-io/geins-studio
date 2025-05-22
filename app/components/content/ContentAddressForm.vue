<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    addressType?: AddressType;
    formInputPrefix?: string;
  }>(),
  {
    addressType: undefined,
    formInputPrefix: undefined,
  },
);

const formPrefix = computed(
  () =>
    `${props.formInputPrefix ? `${props.formInputPrefix}.` : ''}${props.addressType ? `${props.addressType}.` : ''}`,
);
console.log('🚀 ~ formPrefix:', formPrefix.value);
</script>

<template>
  <FormGridWrap>
    <FormGrid design="2+1+1">
      <FormField v-slot="{ componentField }" :name="`${formPrefix}company`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('address.company_name') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} organization`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
    <FormGrid design="2+1+1">
      <FormField
        v-slot="{ componentField }"
        :name="`${formPrefix}addressLine1`"
      >
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('address.addressLine1') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} address-line1`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${formPrefix}zip`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('address.zip') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} postal-code`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${formPrefix}city`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('address.city') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} address-level2`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
    <FormGrid design="1+1">
      <FormField
        v-slot="{ componentField }"
        :name="`${formPrefix}addressLine2`"
      >
        <FormItem v-auto-animate>
          <FormLabel :optional="true">{{
            $t('address.addressLine2')
          }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} address-line2`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${formPrefix}country`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('address.country') }}</FormLabel>
          <FormControl>
            <FormInputCountrySelect
              :model-value="componentField.modelValue"
              @update:model-value="componentField['onUpdate:modelValue']"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
    <FormGrid design="1+1">
      <FormField v-slot="{ componentField }" :name="`${formPrefix}region`">
        <FormItem v-auto-animate>
          <FormLabel :optional="true">{{ $t('address.region') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} address-level1`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
  </FormGridWrap>
  <FormGridWrap>
    <!-- Contact Person Section -->
    <ContentCardHeader
      size="md"
      heading-level="h3"
      :title="$t('contact_person')"
      :description="$t('contact_person_description')"
    />

    <FormGrid design="1+1">
      <FormField v-slot="{ componentField }" :name="`${formPrefix}firstName`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('person.first_name') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} given-name`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${formPrefix}lastName`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('person.last_name') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} family-name`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
    <FormGrid design="1+1">
      <FormField v-slot="{ componentField }" :name="`${formPrefix}email`">
        <FormItem v-auto-animate>
          <FormLabel>{{ $t('person.email') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="email"
              :autocomplete="`${addressType} email`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${formPrefix}phone`">
        <FormItem v-auto-animate>
          <FormLabel :optional="true">{{ $t('person.phone') }}</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="text"
              :autocomplete="`${addressType} tel`"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </FormGrid>
  </FormGridWrap>
</template>
