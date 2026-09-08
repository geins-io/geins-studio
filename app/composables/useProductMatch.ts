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
}

/**
 * Resolves which product an image upload links to, by matching the filename ref
 * (text before the first `_`) against the account's products — article number
 * or product id, whichever hits. Reads the shared products store (already loaded
 * + transformed after auth, so its `thumbnail` is a ready image URL), so no
 * extra fetch and no duplicated transform.
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

  const index = computed(() => {
    const map = new Map<string, ProductMatch>();
    for (const p of products.value) {
      const match: ProductMatch = {
        _id: p._id,
        name: p.name,
        articleNumber: p.articleNumber,
        thumbnail: p.thumbnail,
      };
      if (p.articleNumber) map.set(norm(p.articleNumber), match);
      if (p._id) map.set(norm(p._id), match);
    }
    return map;
  });

  function matchOf(file: File): ProductMatch | null {
    if (mimeToAssetType(file.type) !== 'image') return null;
    const ref = parseProductRef(file.name);
    if (!ref) return null;
    return index.value.get(norm(ref)) ?? null;
  }

  return { pending, matchOf };
}
