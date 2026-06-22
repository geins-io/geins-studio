# `useGeinsApi`

The `useGeinsApi` composable provides utility helpers for ad-hoc requests to the Geins API. It exposes `geinsFetch` as a direct wrapper around the configured API client.

Reactive page reads should use `useAsyncData(key, () => repo.x())` with repositories from `useGeinsRepository()`.

::: tip
This composable is ideal for one-shot calls that do not belong in a repository yet. For structured data access, use [useGeinsRepository](/composables/useGeinsRepository) and `useAsyncData`.
:::

## Features

- Direct API calls with `geinsFetch` (wrapper around `$fetch`)
- Pre-configured with Geins API client
- Useful for imperative actions and edge-case one-offs

## Usage

### Basic Usage

```ts
const { geinsFetch } = useGeinsApi();

// Direct fetch example
const product = await geinsFetch<Product>('/api/product/123');
```

### Recommended page-load read pattern

```ts
const { productApi } = useGeinsRepository();

const { data, error, refresh } = await useAsyncData<Product[]>(
  'products-list',
  () => productApi.product.list(),
);
```

## Properties and Methods

### `geinsFetch`

```ts
geinsFetch<T>(
  url: string,
  options?: NitroFetchOptions<string>,
): Promise<T>
```

A direct API call function that returns a Promise with the response data.

- **Parameters**:
  - `url`: The API endpoint URL
  - `options`: Optional Nitro fetch options (method, body, headers, etc.)
- **Returns**: Promise that resolves to the API response data

## Data-fetching convention

- Page/entity reads: `useAsyncData(key, () => repo.x())`
- Mutations: imperative repository call (`await repo.update(...)`) followed by `await refresh()` on the relevant read
- Cross-page reference data: Pinia store with a fetch action and explicit invalidation
- Avoid raw `useFetch(url)` when a repository exists
- Do not wrap mutations in `useAsyncData`

## When to Use `geinsFetch`

- Fetching data on-demand
- Making one-time API calls (form submissions, actions)
- Building utility functions or composables
- Implementing background data processing

## Error Handling

```ts
const { geinsFetch } = useGeinsApi();

// With geinsFetch
try {
  const result = await geinsFetch<Entity[]>('/api/endpoint');
} catch (error) {
  // handle the error via page/composable error strategy
}
```

## Dependencies

This composable depends on:

1. **Nuxt App Context**: Uses `useNuxtApp().$geinsApi` for the configured API client

## Type Definitions

```ts
function useGeinsApi(): UseGeinsApiReturnType;

interface UseGeinsApiReturnType {
  geinsFetch: <T>(
    url: string,
    options?: NitroFetchOptions<string>,
  ) => Promise<T>;
}
```
