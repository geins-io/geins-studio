<script setup lang="ts" generic="TData">
const entityName = 'user';
</script>

<template>
  <ContentHeader title="Users">
    <ContentActionBar>
      <ButtonNew>{{ $t('new_entity', { entityName }) }}</ButtonNew>
    </ContentActionBar>
  </ContentHeader>
</template>
