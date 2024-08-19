<script setup lang="ts" generic="TData">
const entityName = 'user';
</script>

<template>
  <ContentTitleBlock title="Users" />
  <ContentActionBar>
    <Button>{{ $t('new_entity', { entityName }) }}</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export selected</Button>
  </ContentActionBar>
</template>
