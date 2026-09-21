import type { ProductMatch } from '#shared/types';
import { mimeToAssetType, parseProductRef } from '#shared/utils/asset';
import type { Ref } from 'vue';

interface UseProductMatchReturnType {
  /** The products store hasn't finished its initial load yet. */
  pending: Ref<boolean>;
  /**
   * Resolve the product an upload file links to, or null. Only images whose
   * filename ref (see {@link parseProductRef}) matches a product's article
   * number OR product id link; everything else returns null.
   */
  matchOf: (file: File) => ProductMatch | null;
  /**
   * Resolve a product by article number or product id, or null. Feeds the asset
   * "Used in" section, where an `AssetLink.targetId` is all the API gives back.
   */
  matchById: (id: string) => ProductMatch | null;
}

/**
 * Resolves a product from a reference — either an upload's filename ref (text
 * before the first `_`, via `matchOf`) or a bare id from elsewhere (`matchById`,
 * used by the asset "Used in" section) — matching it against the account's
 * products by article number or product id, whichever hits. Reads the shared
 * products store (already loaded + transformed after auth, so its `thumbnail` is
 * a ready image URL), so no extra fetch and no duplicated transform.
 *
 * cutover: REVISIT@phase2 — the ref → product lookup is the backend's job. For
 * now we match on the client over the full product list; phase 2 pushes the
 * filter server-side (query by articleNumber / productId) so we don't scan the
 * whole catalogue. The `(file) → ProductMatch` seam stays. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function useProductMatch(): UseProductMatchReturnType {
  const productsStore = useProductsStore();
  const { products, ready } = storeToRefs(productsStore);

  // The store is initialised once after auth by the geins-global plugin;
  // init() is idempotent, so calling it here just covers running first.
  productsStore.init();

  const pending = computed(() => !ready.value);

  // Keys normalized (trim + lowercase) so a filename ref matches regardless of
  // case — article numbers / ids are case-insensitive-unique in practice.
  const norm = (v: string | number): string => String(v).trim().toLowerCase();
  // Geins.Media strips a product id's leading zeros before writing an asset
  // link, so `033126` comes back as `33126` and would miss the raw key. Indexed
  // as an extra alias (never replacing the raw key) so both spellings resolve.
  const unpadded = (v: string): string => v.replace(/^0+(?=.)/, '');

  const index = computed(() => {
    const map = new Map<string, ProductMatch>();
    const add = (key: string, match: ProductMatch) => {
      // First writer wins: a real key must never be shadowed by another
      // product's zero-stripped alias.
      if (!map.has(key)) map.set(key, match);
    };
    const matches = products.value.map((p) => ({
      keys: [p.articleNumber, p._id].filter(Boolean).map((k) => norm(k!)),
      match: {
        _id: p._id,
        name: p.name,
        articleNumber: p.articleNumber,
        thumbnail: p.thumbnail,
      } satisfies ProductMatch,
    }));
    for (const { keys, match } of matches)
      for (const key of keys) add(key, match);
    // Aliases go in a second pass so every exact key is already claimed.
    for (const { keys, match } of matches)
      for (const key of keys) add(unpadded(key), match);
    return map;
  });

  function matchById(id: string): ProductMatch | null {
    const key = norm(id);
    if (!key) return null;
    return index.value.get(key) ?? index.value.get(unpadded(key)) ?? null;
  }

  function matchOf(file: File): ProductMatch | null {
    if (mimeToAssetType(file.type) !== 'image') return null;
    const ref = parseProductRef(file.name);
    if (!ref) return null;
    return matchById(ref);
  }

  return { pending, matchOf, matchById };
}
