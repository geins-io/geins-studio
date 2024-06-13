<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <ContentTitleBlock :title="`Edit Product ${route.params.id}`" />
  <ContentActionBar>
    <Button>Save product</Button>
    <Button variant="outline">New</Button>
    <Button variant="outline">Copy</Button>
  </ContentActionBar>
</template>
