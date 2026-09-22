# `useProductMatch`

Resolves a product from a reference — an upload's filename ref (`matchOf`) or a bare id (`matchById`) — by matching it against the account's products. Shared across the upload wizard's [manage](/components/asset/AssetWizardManage.md) (link indicator) and [review](/components/asset/AssetWizardReview.md) ("group by products") steps, and the asset panel's [where it's used](/components/asset/AssetUsedIn.md) section.

The ref is the leading digits before the first `_` (`9963010083_hero.jpg` → `9963010083`), parsed by `parseProductRef`. Parsing the ref from the name is the frontend's job; the lookup that turns it into a product match is the backend's.

:::tip PHASE 2
The lookup matches on the client over the **whole product list** (read from the products store) today. Phase 2 pushes the filter server-side (query by `articleNumber` / `productId`) so we don't scan the full catalogue — the `(file) → ProductMatch` seam stays. Tracked in the cutover ledger (`docs/domains/assets-cutover.md`, STU-335). The match is **persisted** at upload: the wizard sends it as `productIds` on the ticket claim.
:::

## Usage

```ts
const { matchOf } = useProductMatch();

// In a row / group: only images whose ref resolves to a product match.
const product = matchOf(file); // ProductMatch | null
```

It reads the shared **products store** (loaded + transformed once after auth), so there's no extra fetch and the image `thumbnail` is the store's ready-to-use URL.

## Returns

| Field       | Type                             | Meaning                                       |
| ----------- | -------------------------------- | --------------------------------------------- |
| `pending`   | `Ref<boolean>`                   | The products store's initial load isn't done. |
| `matchOf`   | `(file) => ProductMatch \| null` | The product the file links to, or `null`.     |
| `matchById` | `(id) => ProductMatch \| null`   | The product a bare reference resolves to.     |

Only **images** with a filename ref that matches a product's **`_id`** (the id merchants use) **OR its `articleNumber`** link; everything else returns `null`. Matching is case-insensitive. `ProductMatch` extends `EntityBaseWithName` — `{ _id, name, articleNumber, thumbnail? }`.

### Leading zeros

Geins.Media strips a product id's leading zeros before writing an asset link, so a product stored as `033126` comes back from `GET .../links` as `33126`. The index therefore registers a zero-stripped **alias** for every key, in a second pass — an alias never overwrites another product's exact key, so a real id always wins over a coincidental unpadded match.
