<script setup lang="ts">
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
</script>

<template>
  <div>
    <ContentHeader :title="t('quotation') + ' ' + quotationId" />
    <ContentCard>
      <p class="text-muted-foreground">Coming soon..</p>
    </ContentCard>
  </div>
</template>
