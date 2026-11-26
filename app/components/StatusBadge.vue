<script setup lang="ts">
import type { StatusBadgeStatus } from '#shared/types';

const props = defineProps<{
  status: StatusBadgeStatus;
  /** Translated text; defaults to the sentence-cased status. */
  label?: string;
}>();

const { t } = useI18n();

const badgeVariant = computed(() => statusBadgeVariant(props.status));

const badgeText = computed(() => {
  if (props.label) return props.label;
  switch (props.status) {
    case true:
      return t('active');
    case false:
      return t('inactive');
    default:
      return statusBadgeLabel(props.status);
  }
});
</script>
<template>
  <Badge :variant="badgeVariant">
    {{ badgeText }}
  </Badge>
</template>
