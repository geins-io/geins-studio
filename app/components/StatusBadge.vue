<script setup lang="ts">
import type { StatusBadgeStatus } from '#shared/types';

const props = defineProps<{
  status: StatusBadgeStatus;
}>();

const { t } = useI18n();

const badgeVariant = computed(() => {
  switch (props.status) {
    case 'pending':
    case 'on-hold':
    case 'backorder':
    case 'partial':
    case 'sent':
    case 'degraded':
      return 'warning';
    case 'canceled':
    case 'unhealthy':
      return 'negative-light';
    case 'rejected':
      return 'negative';
    case 'refunded':
    case 'inactive':
    case 'idle':
      return 'inactive';
    case 'finalized':
    case 'healthy':
    case 'enabled':
      return 'positive-light';
    case 'accepted':
      return 'positive-outline';
    case 'completed':
    case 'confirmed':
    case true:
      return 'positive';
    case 'draft':
    case false:
      return 'secondary';
    default:
      return 'outline';
  }
});

const badgeText = computed(() => {
  switch (props.status) {
    case true:
      return t('active');
    case false:
      return t('inactive');
    default:
      return (
        String(props.status).charAt(0).toUpperCase() +
        String(props.status).slice(1).replace('-', ' ')
      );
  }
});
</script>
<template>
  <Badge :variant="badgeVariant">
    {{ badgeText }}
  </Badge>
</template>
