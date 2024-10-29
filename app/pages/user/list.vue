<script setup lang="ts" generic="TData">
const entityName = 'user';
</script>

<template>
  <ContentTitleBlock title="Users" />
  <ContentActionBar>
    <Button>{{ $t('new_entity', { entityName }) }}</Button>
    <Button variant="secondary">Export all</Button>
    <Button variant="secondary">Export selected</Button>
  </ContentActionBar>
</template>
