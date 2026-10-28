import type { PriceListRule, PriceListRuleField } from '#shared/types';

/** Prefix of the made-up ids a price list preview gives rows that aren't saved. */
export const PREVIEW_ID_PREFIX = 'new_';

/**
 * Whether `id` is a made-up id from a price list preview. Create and update
 * fail on these, so they must never be sent back.
 */
export function isPreviewId(id?: string): boolean {
  return !!id?.startsWith(PREVIEW_ID_PREFIX);
}

/** A product's previewed values at quantity 1, in the list's currency and VAT basis. */
export interface PriceListProductBase {
  price?: number;
  margin?: number;
  regularPrice?: number;
}

export type PriceListPrices = Pick<
  PriceListRule,
  'price' | 'margin' | 'discountPercent'
>;

const round = (value?: number) =>
  value !== undefined && Number.isFinite(value)
    ? Math.round(value * 100) / 100
    : undefined;

/**
 * Local stand-in for `previewprice`, which needs a saved list: the price,
 * margin and discount from one of them. Cost comes from the previewed price
 * and margin instead of the purchase price, so the list's currency and VAT
 * basis are already applied. A value it can't work out stays undefined.
 */
export function calculatePriceListPrices(
  field: PriceListRuleField,
  value: number,
  base: PriceListProductBase,
): PriceListPrices {
  const { price: basePrice, margin: baseMargin, regularPrice } = base;
  const cost =
    basePrice && basePrice > 0 && baseMargin !== undefined
      ? basePrice * (1 - baseMargin / 100)
      : undefined;

  let price: number | undefined;
  if (field === 'price') price = value;
  else if (field === 'discountPercent' && regularPrice)
    price = regularPrice * (1 - value / 100);
  else if (field === 'margin' && cost !== undefined && value < 100)
    price = cost / (1 - value / 100);

  return {
    price: field === 'price' ? value : round(price),
    margin:
      field === 'margin'
        ? value
        : price && cost !== undefined
          ? round((1 - cost / price) * 100)
          : undefined,
    discountPercent:
      field === 'discountPercent'
        ? value
        : price !== undefined && regularPrice
          ? round((1 - price / regularPrice) * 100)
          : undefined,
  };
}
