# `useGeinsApi`

The `useGeinsApi` composable provides utility functions for making API requests to the Geins API. It offers both reactive (`useGeinsFetch`) and direct (`geinsFetch`) methods for data fetching, built on top of Nuxt's fetch utilities with pre-configured Geins API integration.

::: tip
This composable is ideal for ad-hoc queries that don't fit into a specific repository, or as a foundation for building more specific API composables. For structured data access, consider using dedicated repository composable [useGeinsRepository](/composables/useGeinsRepository).
:::

## Features

- Reactive data fetching with `useGeinsFetch` (wrapper around Nuxt's `useFetch`)
- Direct API calls with `geinsFetch` (wrapper around `$fetch`)
- Pre-configured with Geins API client
- Compatible with all Nuxt fetch options and features

## Usage

Here are the different ways you can use the `useGeinsApi` composable:

### Basic Usage

```ts
const { useGeinsFetch, geinsFetch } = useGeinsApi();

// Reactive fetch example
const { data, status, error } = await useGeinsFetch<Product[]>('/product/list');

// Direct fetch example
const product = await geinsFetch<Product>('/product/123');
```

## Properties and Methods

### `useGeinsFetch`

```ts
useGeinsFetch<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
): ReturnType<typeof useFetch>
```

A reactive wrapper around [Nuxt's `useFetch`](https://nuxt.com/docs/3.x/api/composables/use-fetch) that is pre-configured with the Geins API client.

- **Parameters**:
  - `url`: The API endpoint URL (string or reactive function)
  - `options`: Optional Nuxt `UseFetchOptions` configuration
- **Returns**: Nuxt's `useFetch` return object with `data`, `pending`, `error`, `refresh`, etc.

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

## When to Use Each Method

### Use `useGeinsFetch` when:

- Fetching data on page load
- Building reactive UI components that display API data
- You need automatic loading and error states
- Data should automatically refresh when dependencies change
- Implementing real-time data updates

### Use `geinsFetch` when:

- Fetching data on-demand
- Making one-time API calls (form submissions, actions)
- Building utility functions or composables
- Implementing background data processing

## Error Handling

```ts
const { useGeinsFetch, geinsFetch } = useGeinsApi();

// With useGeinsFetch
const { data, error } = await useGeinsFetch<Entity[]>('/api/endpoint');
if (error.value) {
  console.error('Reactive fetch error:', error.value);
}

// With geinsFetch
try {
  const result = await geinsFetch<Entity[]>('/api/endpoint');
} catch (error) {
  console.error('Direct fetch error:', error);
}
```

## Dependencies

This composable depends on:

1. **Nuxt App Context**: Uses `useNuxtApp().$geinsApi` for the configured API client
2. **Nuxt's `useFetch`**: For reactive data fetching capabilities

## Type Definitions

```ts
interface UseGeinsApiReturnType {
  useGeinsFetch: <T>(
    url: string | (() => string),
    options?: UseFetchOptions<T>,
  ) => ReturnType<typeof useFetch>;
  geinsFetch: <T>(
    url: string,
    options?: NitroFetchOptions<string>,
  ) => Promise<T>;
}
```
