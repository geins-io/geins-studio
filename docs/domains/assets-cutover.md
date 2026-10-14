# Assets Library — cutover ledger

Single source of truth for the Assets Library's _temporary_ scaffolding, so nothing rots as the backend catches up. What remains is **phase-2 parity**: client-side work the backend may take over.

Tracking issue: [STU-331](https://linear.app/geins/issue/STU-331). Backend plan: [asset-library-phase-1](https://github.com/geins-io/geins-platform/blob/master/plans/asset-library-phase-1.md).

## How to use this

```bash
grep -rn "cutover:" app server shared nuxt.config.ts   # every marked temporary site
```

The `// cutover:` marker is a **semantic marker, not an issue reference** (so it's fine under the no-issue-refs-in-comments rule). The grep set and this table must agree — if you add a temporary site, mark it _and_ add a row.

## Dispositions

- **REVISIT@phase2** — becomes inert once phase 2 moves the work server-side; strip it then.

## The rule that keeps this honest

**A feature the backend supports gets no stand-in.** When phase 2 takes something over, delete the client-side version and its row in the same change — don't keep both paths alive. The capability flags went this way: each was deleted with its consumers the moment its feature shipped, never flipped to `true`, until STU-378 retired the mechanism itself.

## Ledger

| Item                                       | Location                                                                   | Disposition    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STU-335** — client-side product matching | `app/composables/useProductMatch.ts` (`cutover:`)                          | REVISIT@phase2 | The wizard's "auto-link images to products" resolves a filename ref → product by matching on the client over the whole product list (read from the products store). Phase 2 pushes the filter server-side (query by `articleNumber`/`productId`) so we don't scan the full catalogue; the `(file) → ProductMatch` seam stays. Link **persistence** already ships — a matched product rides the upload claim as a `links` item (`productimage` / `productfile` by asset type) — so only the client-side _match_ is temporary. |
| **STU-350** — client-side link resolution  | `app/composables/useProductMatch.ts` (`matchById` + zero-stripped aliases) | REVISIT@phase2 | `GET /media/assets/{id}/links` resolves nothing and returns no display name, so `matchById` resolves `targetId` client-side off the whole products list — same caveat as STU-335. The leading-zero aliases exist because Geins.Media strips a product id's leading zeros when writing a link (`033126` → `33126`). If the backend ever resolves targets or returns a display name, the whole client-side resolution (and the alias pass) goes.                                                                               |

## Phase-2 parity cleanup

When `grep -rn "cutover:"` returns nothing, the ledger is discharged and this file can go.

## Discharged

**Capability flags (STU-378, 2026-10-14)** — the gating mechanism itself: `useAssetCapabilities`, `assetCapabilities()`, the `AssetCapabilities` type and its docs page. Every flag had already been deleted with its consumers as its feature shipped: `canEditDescriptionAltText`, `canDeleteAsset`, `hasTrash` and `hasUsageLinks`; `canRenameAsset` / `canMoveAsset` (STU-355, `relocate`); `canReplaceFile` (STU-367, replace on the ticket flow); `canDeleteFolderWithAssets` and its empty-only folder delete gate (STU-368, `DELETE media/folders/{id}?action=` with trash / relocate / purge); `canEditTags` / `canEditChannels` / `tagAutocomplete` (STU-366, the detail panel `PATCH` + `GET media/tags`); `hasThumbnails` (STU-402, previews scale on the CDN via `assetPreviewUrl`); and `canUploadTagsAndChannels` (STU-379).

**Wizard tags + channels (STU-379, 2026-10-14)** — the four `<fieldset :disabled>` gates on `canUploadTagsAndChannels` in `AssetWizardManage` + `AssetWizardBulkPane` and their "not saved yet" hint. The upload ticket takes `tags` + `channels` (PLA-570), so the wizard sends them on the claim.

**Storage usage (STU-413, 2026-10-13)** — the static placeholder figures in `useAssetStorage` (fixed totals, type and folder rows). The header bar and the panel now read `GET media/usage`, breakdown included.
