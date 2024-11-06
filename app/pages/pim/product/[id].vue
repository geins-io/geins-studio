<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const entityName = 'product';
</script>

<template>
  <ContentHeader>
    <template #title>
      <ContentTitleBlock :title="`Edit Product ${route.params.id}`" />
    </template>
    <template #actions>
      <ContentActionBar>
        <ButtonNew variant="secondary">New</ButtonNew>
        <ButtonCopy variant="secondary">Copy</ButtonCopy>
        <ButtonSave>{{ $t('save_entity', { entityName }) }}</ButtonSave>
      </ContentActionBar>
    </template>
  </ContentHeader>
</template>
