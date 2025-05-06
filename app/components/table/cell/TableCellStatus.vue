<script setup lang="ts">
const props = defineProps<{
  status: boolean | string;
}>();

const { t } = useI18n();

const badgeVariant = computed(() => {
  switch (props.status) {
    case true:
      return 'positive';
    case false:
      return 'secondary';
    default:
      return 'default';
  }
});

const badgeText = computed(() => {
  switch (props.status) {
    case true:
      return t('active');
    case false:
      return t('inactive');
    default:
      return String(props.status);
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
