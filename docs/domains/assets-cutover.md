# Assets Library — cutover ledger

Single source of truth for the Assets Library's _temporary_ scaffolding, so nothing rots as the real backend catches up. The mock → `Geins.Media` cutover is **done**; what remains is **phase-2 parity**.

Tracking issue: [STU-331](https://linear.app/geins/issue/STU-331). Backend plan: [asset-library-phase-1](https://github.com/geins-io/geins-platform/blob/master/plans/asset-library-phase-1.md).

## How to use this

```bash
grep -rn "cutover:" app server shared nuxt.config.ts   # every marked temporary site
grep -rn "useAssetCapabilities" app                     # every capability-gating consumer
```

The `// cutover:` marker is a **semantic marker, not an issue reference** (so it's fine under the no-issue-refs-in-comments rule). The grep set and this table must agree — if you add a temporary site, mark it _and_ add a row.

## Dispositions

- **REVISIT@phase2** — becomes inert once phase 2 restores the feature; strip it then.

Only one disposition is left. Everything marked `REMOVE@cutover` has been deleted (see [Discharged](#discharged)), and everything marked `KEEP` is now just ordinary code — it _is_ the real API contract, so it needs no ledger row.

## The rule that keeps this honest

**A feature the backend supports gets no flag.** When phase 2 restores something, delete its capability **and** its consumers — don't flip the flag to `true`. An always-`true` flag is dead gating, which is exactly what this ledger exists to prevent. Precedent: STU-355 retired `canRenameAsset` / `canMoveAsset` the moment `relocate` shipped, and STU-354 retired `canEditDescriptionAltText`, `canDeleteAsset`, `hasTrash` and `hasUsageLinks` at cutover rather than leaving four permanently-true flags behind.

## Ledger

| Item                                         | Location                                                                                                                                                                                                                                                           | Disposition    | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STU-324 / STU-346** — capability mechanism | `app/composables/useAssetCapabilities.ts`, `assetCapabilities` in `shared/utils/asset.ts` (both `cutover:`)                                                                                                                                                        | REVISIT@phase2 | The gating engine, now a constant: `assetCapabilities()` takes no argument and every remaining flag is `false`. Six are left — `canEditTags`, `canEditChannels`, `canDeleteFolderWithAssets`, `canReplaceFile`, `tagAutocomplete`, `hasThumbnails` — one per feature phase 1 does not serve. Delete the composable, the function, the `AssetCapabilities` type and this row once the last one lands.                                                                        |
| **STU-324 / STU-346** — gating consumers     | `grep useAssetCapabilities` — `AssetDetailPanel` (tags + channels `<fieldset>` gates, tag-fetch `immediate`), `AssetFolderTree` (folder-delete flow), `AssetWizardManage` + `AssetWizardBulkPane` (tags + channels `<fieldset :disabled>` + tag-fetch `immediate`) | REVISIT@phase2 | Each still-phase-2 metadata group sits in its own `<fieldset :disabled>` (which reliably disables nested custom controls). When a capability becomes permanently true the `:disabled="!caps.*"` bindings and their `<fieldset>`s are inert — strip them with the flag.                                                                                                                                                                                                      |
| **STU-328** — empty-only folder delete gate  | `app/components/asset/AssetFolderTree.vue` (`canDeleteFolderWithAssets` branch), `shared/utils/asset.ts` + `shared/types/Asset.ts` (the flag)                                                                                                                      | REVISIT@phase2 | With the capability off, the tree skips the subtree count probe + `AssetFolderDeleteDialog` and calls `assetApi.folder.delete(id)`, surfacing `409 FOLDER_NOT_EMPTY` inline. **`AssetFolderDeleteDialog` + `assetApi.deleteFolder(id, assets)` are deliberately kept** — phase 2 may restore the disposition. If it does: flip the flag on and delete the branch; if it never does, delete the dialog + `deleteFolder` (and the `?assets` query) instead and drop the flag. |
| **STU-335** — client-side product matching   | `app/composables/useProductMatch.ts` (`cutover:`)                                                                                                                                                                                                                  | REVISIT@phase2 | The wizard's "auto-link images to products" resolves a filename ref → product by matching on the client over the whole product list (read from the products store). Phase 2 pushes the filter server-side (query by `articleNumber`/`productId`) so we don't scan the full catalogue; the `(file) → ProductMatch` seam stays. Link **persistence** already ships — a matched product rides the upload claim as `productIds` — so only the client-side _match_ is temporary. |
| **STU-350** — client-side link resolution    | `app/composables/useProductMatch.ts` (`matchById` + zero-stripped aliases)                                                                                                                                                                                         | REVISIT@phase2 | `GET /media/assets/{id}/links` resolves nothing and returns no display name, so `matchById` resolves `targetId` client-side off the whole products list — same caveat as STU-335. The leading-zero aliases exist because Geins.Media strips a product id's leading zeros when writing a link (`033126` → `33126`). If the backend ever resolves targets or returns a display name, the whole client-side resolution (and the alias pass) goes.                              |

## Phase-2 parity cleanup

1. `grep -rn "useAssetCapabilities"` → remove each consumer's gate (the `<fieldset>`s and `:disabled` bindings).
2. Delete `useAssetCapabilities.ts`, `assetCapabilities`, and the `AssetCapabilities` type.
3. `grep -rn "cutover:"` returns nothing → the ledger is discharged and this file can go.

Two features also need a copy pass when their disposition is settled: `folder_delete_delete_description` still says "permanently" (accurate only if phase 2 restores folder-delete-with-assets), and the [replace dialog](/components/asset/AssetReplaceDialog)'s "used everywhere" warning is static until replace ships and can be fed from the links endpoint.

## Discharged

**At cutover (STU-354, 2026-09-22)** — the Supabase mock and everything that existed only to bridge to it:

- `server/api/asset/**`, `server/utils/assets-mock.ts`, `server/utils/upload-tickets.ts` — with them the row mappers, `_type: 'geins.asset'`, the path derivation, `distinctSortedTags`, `resolveAssetFolderFilter`, the etag/`If-Match` emulation, the `description` column mirror, and the whole ticket emulation.
- `supabase/migrations/**` and the `@supabase/supabase-js` dependency; the Supabase project itself is retired separately.
- The transport switch: `assetEndpoints`, the `AssetEndpoints` / `AssetsBackend` types, the `backend` arg on `assetRepo`, the `assetsBackend` runtime config and `NUXT_PUBLIC_ASSETS_BACKEND`. The repos read `ENTITIES.asset` / `ENTITIES.folder` again; the two real deltas (`GET /media/folders` at the collection root, `PUT` for a folder update) are now plain overrides in the repo, and `/media/tickets` a constant.
- Folder `sortOrder` + `system` — no manual ordering and no system folders in the real API, so the tree sorts by name and `useFolders` filters nothing.
- Four capability flags that the cutover made permanently true: `canEditDescriptionAltText`, `canDeleteAsset`, `hasTrash`, `hasUsageLinks`, along with `AssetActionsMenu`'s `canDelete` prop and the `v-if` on the "Where it's used" section.

**Earlier** — `canRenameAsset` / `canMoveAsset` (STU-355, retired when `relocate` shipped) and the single `POST /asset/upload` route + `assetApi.upload` (STU-333, retired ahead of cutover).

Everything else the Phase 8 prep added turned out to be the real contract and simply stayed: `path`/`folderPath`/`depth`, the asset `etag` and the client's `If-Match` + `412` handling, per-locale `description` in `localizations`, `POST /media/assets/query` with `folderIds` + `all: true`, the three folder scopes, the ticket upload client, `relocate`, trash + restore, and the `AssetLink` shape.
