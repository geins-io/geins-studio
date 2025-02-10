<script setup lang="ts">
const showData = ref();
const clickHandler = async () => {
  const apiEndpoint = '/account/language/list';
  const { data, error } = await useAPI<Entity[]>(apiEndpoint);
  showData.value = data.value;
};
</script>
<template>
  <div>
    <Button @click="clickHandler">Click me</Button>
    <pre>
      {{ showData }}
    </pre>
  </div>
</template>
