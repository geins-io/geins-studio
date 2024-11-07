<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const entityName = 'product';
</script>

<template>
  <ContentHeader :title="`Edit Product ${route.params.id}`">
    <ContentActionBar>
      <ButtonNew variant="secondary">New</ButtonNew>
      <ButtonCopy variant="secondary">Copy</ButtonCopy>
      <ButtonSave>{{ $t('save_entity', { entityName }) }}</ButtonSave>
    </ContentActionBar>
  </ContentHeader>
</template>
