# `usePageTitle`

The `usePageTitle` composable sets the browser tab title based on the current breadcrumb trail. It derives the title from `useBreadcrumbsStore`, which merges navigation breadcrumbs with any dynamic entity name override set via `setCurrentTitle`.

The app name ("Geins Studio") is appended via the global `titleTemplate` defined in `app.vue`, so this composable only returns the breadcrumb-derived portion.

## Features

- **Automatic derivation** from the breadcrumb trail — no per-page setup needed
- **Dynamic entity names** via `setCurrentTitle` (same call used for breadcrumbs)
- **Format**: `"Most Specific - Parent"` (breadcrumb labels reversed, titleTemplate appends `- Geins Studio`)

## Usage

### Setup (once in the default layout)

```ts
// app/layouts/default.vue
const { pageTitle } = usePageTitle();
```

That's it — every page automatically gets the correct title based on breadcrumbs.

### Title Examples

| Page                 | Breadcrumb Trail              | Browser Tab Title                      |
| -------------------- | ----------------------------- | -------------------------------------- |
| Quotation list       | Orders → Quotations           | Quotations - Orders - Geins Studio     |
| Quotation edit       | Orders → Quotations → Q-1001 | Q-1001 - Quotations - Geins Studio     |
| Root / Start         | _(empty)_                     | Geins Studio                           |

## Properties and Methods

### `pageTitle`

```ts
pageTitle: Readonly<Ref<string>>
```

A computed ref containing the current page title string (without the app name suffix). Empty string when the breadcrumb trail is empty.

## Type Definitions

```ts
function usePageTitle(): UsePageTitleReturnType;

interface UsePageTitleReturnType {
  pageTitle: Readonly<Ref<string>>;
}
```
