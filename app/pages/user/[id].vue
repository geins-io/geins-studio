<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const entityName = (route.name as string)?.split('-')[0];

const { user } = useUserStore();
</script>

<template>
  <ContentTitleBlock :title="`${user.firstname} ${user.lastname}`" />
  <ContentActionBar>
    <Button>{{ $t('save_entity', { entityName }) }}</Button>
    <Button variant="outline">New</Button>
    <Button variant="outline">Copy</Button>
  </ContentActionBar>
</template>
