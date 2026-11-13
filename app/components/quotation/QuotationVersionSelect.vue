<script setup lang="ts">
import type { QuotationRevision } from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';
import { isAnsweredRequest, liveRevision } from '#shared/utils/quotation';

const props = defineProps<{
  /** Every version in the chain, newest first, as `revisions` lists them */
  revisions: QuotationRevision[];
  /** The version shown */
  quotationId: string;
}>();

const { t } = useI18n();
const { formatDate } = useDate();

const liveId = computed(() => liveRevision(props)?.quotationId);

const statusText = (version: QuotationRevision): string => {
  if (version.quotationId === liveId.value) return t('orders.latest_version');
  if (isAnsweredRequest(version)) return t('orders.answered_request');
  // As StatusBadge shows it
  return version.status.charAt(0).toUpperCase() + version.status.slice(1);
};

const optionText = (version: QuotationRevision): string =>
  [
    version.quotationNumber,
    statusText(version),
    version.validFrom && formatDate(version.validFrom, { dateStyle: 'medium' }),
  ]
    .filter(Boolean)
    .join(' · ');

// Each version is its own quotation, so picking one opens its page
const openVersion = (quotationId: unknown) => {
  if (typeof quotationId !== 'string' || quotationId === props.quotationId) {
    return;
  }
  navigateTo(entityEditUrl('quotation', quotationId));
};
</script>

<template>
  <Select :model-value="quotationId" @update:model-value="openVersion">
    <SelectTrigger class="w-auto min-w-60" :aria-label="$t('version')">
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="end">
      <SelectItem
        v-for="version in revisions"
        :key="version.quotationId"
        :value="version.quotationId"
      >
        {{ optionText(version) }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
