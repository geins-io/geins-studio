<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date';

// TODO: Implement quotations detail functionality
// This is a placeholder for the new Quotations feature

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const { t } = useI18n();

const quotationId = computed(() => route.params.id as string);

// Placeholder data structure
const quotation = ref(null);
const validTo = ref();
const minDate = today(getLocalTimeZone());
</script>

<template>
  <div>
    <ContentHeader :title="$t('quotation') + ' ' + quotationId" />
    <ContentCard>
      <FormInputDate
        v-model="validTo"
        :min-value="minDate"
        :placeholder="t('expiration_date')"
      />
    </ContentCard>
  </div>
</template>
