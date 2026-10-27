import type { ProductPriceList } from '#shared/types';

type PriceListOwnership = Pick<
  ProductPriceList,
  'accountSpecific' | 'wholesaleAccountId'
>;

/**
 * Whether `priceList` is an account list owned by the wholesale account
 * `accountId`. A shared list sends `wholesaleAccountId: ""`, so branch on
 * `accountSpecific` rather than null-checking the id.
 */
export function isOwnAccountPriceList(
  priceList: PriceListOwnership,
  accountId: string,
): boolean {
  return (
    priceList.accountSpecific && priceList.wholesaleAccountId === accountId
  );
}

export interface AccountPriceListPick<T> {
  priceList?: T;
  /** True when no list matched the channel and currency, so the first was used. */
  fallback: boolean;
}

/**
 * The account list to show for a company: the one in its default `channel`
 * and `currency`. Without a match, falls back to the first list.
 */
export function pickAccountPriceList<
  T extends Pick<ProductPriceList, 'channel' | 'currency'>,
>(lists: T[], channel?: string, currency?: string): AccountPriceListPick<T> {
  const match = lists.find(
    (pl) => String(pl.channel) === String(channel) && pl.currency === currency,
  );
  if (match) return { priceList: match, fallback: false };
  return { priceList: lists[0], fallback: lists.length > 0 };
}
