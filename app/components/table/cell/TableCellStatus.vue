<script setup lang="ts">
const props = defineProps<{
  status: boolean | string;
}>();

const { t } = useI18n();

const badgeVariant = computed(() => {
  switch (props.status) {
    case 'active':
      return 'positive';
    case 'pending':
      return 'outline';
    case 'on-hold':
    case 'backorder':
    case 'partial':
      return 'warning';
    case 'cancelled':
      return 'negative';
    case 'refunded':
    case 'inactive':
      return 'inactive';
    case 'completed':
    case true:
      return 'positive';
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
  <div>
    <Badge :variant="badgeVariant">
      {{ badgeText }}
    </Badge>
  </div>
</template>
