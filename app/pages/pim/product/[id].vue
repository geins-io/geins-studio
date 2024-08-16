<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const entityName = 'product';
</script>

<template>
  <ContentTitleBlock :title="`Edit Product ${route.params.id}`" />
  <ContentActionBar>
    <Button>{{ $t('save_entity', { entityName }) }}</Button>
    <Button variant="outline">New</Button>
    <Button variant="outline">Copy</Button>
  </ContentActionBar>
</template>
