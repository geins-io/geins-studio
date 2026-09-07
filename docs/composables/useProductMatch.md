# `useProductMatch`

Resolves which product an image upload links to, by matching a ref parsed from the filename against the account's products. Shared across the upload wizard's [manage](/components/asset/AssetWizardManage.md) (link indicator) and [review](/components/asset/AssetWizardReview.md) ("group by products") steps.

The ref is the leading digits before the first `_` (`9963010083_hero.jpg` → `9963010083`), parsed by `parseProductRef`. Parsing the ref from the name is the frontend's job; the lookup that turns it into a product match is the backend's.

:::tip PHASE 2
The ref → product lookup fetches the **whole product list** and matches on the client today. Phase 2 pushes the filter server-side (`productApi.query` by `articleNumber` / `productId`) so we don't over-fetch — the `(file, matchBy) → ProductMatch` seam stays. Tracked in the cutover ledger (`docs/domains/assets-cutover.md`, STU-335).
:::

## Usage

```ts
const { matchOf } = useProductMatch();

// In a row / group: only images whose ref resolves to a product match.
const product = matchOf(file); // ProductMatch | null
```

The product list is fetched once via a stable `useAsyncData` key, so calling the composable in both wizard steps shares a single fetch.

## Returns

| Field     | Type                             | Meaning                                    |
| --------- | -------------------------------- | ------------------------------------------ |
| `pending` | `Ref<boolean>`                   | The product-list fetch is still in flight. |
| `matchOf` | `(file) => ProductMatch \| null` | The product the file links to, or `null`.  |

Only **images** with a filename ref that matches a product's **`_id`** (the id merchants use) **OR its `articleNumber`** link; everything else returns `null`. Matching is case-insensitive. `ProductMatch` extends `EntityBaseWithName` — `{ _id, name, articleNumber }`.
