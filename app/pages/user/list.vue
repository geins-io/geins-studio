<script setup lang="ts" generic="TData">
const entityName = 'user';
</script>

<template>
  <ContentHeader>
    <template #title>
      <ContentTitleBlock :title="`Users`" />
    </template>
    <template #actions>
      <ContentActionBar>
        <ButtonNew>{{ $t('new_entity', { entityName }) }}</ButtonNew>
      </ContentActionBar>
    </template>
  </ContentHeader>
</template>
