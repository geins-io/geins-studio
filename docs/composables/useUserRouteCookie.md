# `useUserRouteCookie`

The `useUserRouteCookie` composable returns a cookie scoped to the signed-in user and the current route path, kept for a year. Use it for per-list UI preferences, so column options and pinned filters share one naming and lifetime.

## Usage

```ts
const columnOrder = useUserRouteCookie<ColumnOrderState>('geins-order', {
  default: () => [],
});
```

The cookie name is `${prefix}-${userId}${path}`, e.g. `geins-order-u1/assets`. Without a signed-in user, `userId` is `default`.

| Prefix                 | Owner                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `geins-cols`           | `TableView` column visibility                                  |
| `geins-order`          | `TableView` column order                                       |
| `geins-filters-pinned` | [`useListFilters`](/composables/useListFilters) pinned filters |

## Type Definitions

```ts
function useUserRouteCookie<T>(
  prefix: string,
  options?: { default?: () => T },
): CookieRef<T>;
```
