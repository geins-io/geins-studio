<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const entityName = 'product';
</script>

<template>
  <ContentEdit>
    <template #header>
      <ContentHeader :title="`Edit Product ${route.params.id}`">
        <ContentActionBar>
          <ButtonNew variant="secondary">New</ButtonNew>
          <ButtonCopy variant="secondary">Copy</ButtonCopy>
          <ButtonSave>{{ $t('save_entity', { entityName }) }}</ButtonSave>
        </ContentActionBar>
        <template #tabs>
          <ContentTabs class="mt-5" />
        </template>
      </ContentHeader>
    </template>
    <ContentEditMain>
      <Card>Main</Card>
      <Card>Details</Card>
    </ContentEditMain>
  </ContentEdit>
</template>
