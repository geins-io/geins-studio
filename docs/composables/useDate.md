# `useDate`

The `useDate` composable provides locale-aware date formatting utilities. It wraps reka-ui's `useDateFormatter` with the app's current locale to ensure consistent date display across the application — matching the format used in table date columns and the calendar date picker.

## Features

- **Locale-aware formatting** using the app's current i18n locale
- **Consistent format** across tables, summaries, and date inputs (`dateStyle: 'long'`)
- **Flexible options** via standard `Intl.DateTimeFormatOptions` overrides
- **Relative formatting** ("in 12 days", "3 hours ago") via `formatRelativeDate`
- **Safe handling** of empty, null, or invalid date values

## Usage

### Basic Usage

```ts
const { formatDate } = useDate();

// Format an ISO string (defaults to dateStyle: 'long')
formatDate('2026-02-23T00:00:00Z');
// → "February 23, 2026" (en) / "23 februari 2026" (sv)

// Format a Date object
formatDate(new Date());

// Empty or null values return ''
formatDate(null); // → ''
formatDate(undefined); // → ''
```

### Custom Format Options

```ts
const { formatDate } = useDate();

// Short date style
formatDate('2026-02-23T00:00:00Z', { dateStyle: 'short' });
// → "2/23/26" (en)

// Custom options
formatDate('2026-02-23T00:00:00Z', { month: 'short', year: 'numeric' });
// → "Feb 2026" (en)
```

### In Summary Data

```ts
const { formatDate } = useDate();

const summary = computed(() => [
  ...(formValues?.expirationDate
    ? [
        {
          label: t('expiration_date'),
          value: formatDate(formValues.expirationDate),
        },
      ]
    : []),
]);
```

## Properties and Methods

### `formatDate`

```ts
formatDate(
  value: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string
```

Formats a date value using the app's current locale.

- **Parameters**:
  - `value`: The date to format (ISO string, Date object, or nullish)
  - `options` (optional): `Intl.DateTimeFormatOptions` to customize the output. Defaults to `{ dateStyle: 'long' }`

- **Returns**: Formatted date string, or `''` for nullish values, or the raw string for invalid dates

### `formatRelativeDate`

```ts
formatRelativeDate(
  value: string | Date | undefined | null,
  now?: Date
): string
```

Formats a date relative to `now` with `Intl.RelativeTimeFormat` (`numeric: 'auto'`) in the app locale. Picks the largest fitting unit of year, month (30 days), day, hour, minute and second. There are no weeks, so 12 days reads "in 12 days", not "in 2 weeks". One day reads "tomorrow" / "yesterday".

```ts
const { formatRelativeDate } = useDate();

formatRelativeDate(asset.purgeAfter); // → "in 12 days" (en) / "om 12 dagar" (sv)
formatRelativeDate('2026-09-30T09:00:00Z', new Date('2026-09-30T12:00:00Z'));
// → "3 hours ago"
```

- **Parameters**:
  - `value`: The date to format (ISO string, Date object, or nullish)
  - `now` (optional): The reference point. Defaults to the current time

- **Returns**: Relative string, or `''` for nullish values, or the raw string for invalid dates

## Type Definitions

```ts
function useDate(): UseDateReturnType;

interface UseDateReturnType {
  formatDate: (
    value: string | Date | undefined | null,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatRelativeDate: (
    value: string | Date | undefined | null,
    now?: Date,
  ) => string;
}
```
