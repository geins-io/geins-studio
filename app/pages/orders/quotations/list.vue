<script setup lang="ts">
// TODO: Implement quotations list functionality
// This is a placeholder for the new Quotations feature

definePageMeta({
  layout: 'default',
});

const { t } = useI18n();

// Placeholder data structure
const quotations = ref([]);
</script>

<template>
  <div>
    <ContentHeader :title="$t('quotation', 2)" />
    <ContentCard>
      <p class="text-muted-foreground">Coming soon..</p>
    </ContentCard>
  </div>
</template>
