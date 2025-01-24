# `useAPI`

The `useAPI` composable provides a custom `useFetch` function that is used to fetch data from an API. It is built on top of Nuxt's `useFetch` and fully matches its functionality.

::: tip
Read the full documentation on [Nuxt's `useFetch`](https://nuxt.com/docs/api/composables/use-fetch) to get a better understanding of how to use `useAPI`.
:::

## Usage

```ts
<script setup lang="ts">
const apiEndpoint = '/account/market/list';
const dataList = ref<Entity[]>([]);

const { data, error } = await useAPI<Entity[]>(apiEndpoint);

if (!data?.value || error.value) {
  console.error(error.value);
} else {
  dataList.value = data.value;
}
</script>
```
