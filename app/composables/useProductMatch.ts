import type { ProductMatch } from '#shared/types';
import { mimeToAssetType, parseProductRef } from '#shared/utils/asset';
import type { Ref } from 'vue';

interface UseProductMatchReturnType {
  /** The product-list fetch is still in flight (first load). */
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
 * or product id, whichever hits. Shared across the wizard's manage + review
 * steps via a stable `useAsyncData` key, so the product list is fetched once.
 *
 * cutover: REVISIT@phase2 — the ref → product lookup is the backend's job. For
 * now we fetch the whole product list and match on the client; phase 2 pushes
 * the filter server-side (`productApi.query` by articleNumber / productId) so we
 * don't over-fetch. The `(file) → ProductMatch` seam stays. Ledger:
 * docs/domains/assets-cutover.md.
 */
export function useProductMatch(): UseProductMatchReturnType {
  const { productApi } = useGeinsRepository();

  const { data, pending } = useAsyncData<ProductMatch[]>(
    'product-match-index',
    async () => {
      const res = await productApi.list();
      const items = Array.isArray(res?.items) ? res.items : [];
      return items.map((p) => ({
        _id: p._id,
        articleNumber: p.articleNumber,
        name: p.name,
      }));
    },
    { default: () => [], lazy: true },
  );

  // Keys normalized (trim + lowercase) so a filename ref matches regardless of
  // case — article numbers / ids are case-insensitive-unique in practice.
  const norm = (v: string | number): string => String(v).trim().toLowerCase();

  const index = computed(() => {
    const map = new Map<string, ProductMatch>();
    for (const p of data.value ?? []) {
      if (p.articleNumber) map.set(norm(p.articleNumber), p);
      if (p._id) map.set(norm(p._id), p);
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
