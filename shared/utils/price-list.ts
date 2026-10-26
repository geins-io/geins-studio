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
