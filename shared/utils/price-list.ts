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

export type CompanyPriceListSaveAction =
  | 'create'
  | 'activate'
  | 'deactivate'
  | 'none';

/**
 * What "Save company" does to the company's own list for the switch state
 * `enabled`. Off keeps the list (and its prices) and only deactivates it. A
 * read-only (ERP) list is never saved: `PATCH` on it answers 422.
 */
export function getCompanyPriceListSaveAction(
  priceList: Pick<ProductPriceList, 'active' | 'readOnly'> | undefined,
  enabled: boolean,
): CompanyPriceListSaveAction {
  if (!priceList) return enabled ? 'create' : 'none';
  if (priceList.readOnly || priceList.active === enabled) return 'none';
  return enabled ? 'activate' : 'deactivate';
}

export interface PriceListSummaryCounts {
  manual: number;
  volume: number;
}

/**
 * The manual and volume price counts from `fields: ['counts']`. Undefined
 * while the API leaves either one null, so the summary hides the line.
 */
export function getPriceListSummaryCounts(
  priceList?: Pick<
    ProductPriceList,
    'manualPriceProductCount' | 'volumePriceProductCount'
  > | null,
): PriceListSummaryCounts | undefined {
  const manual = priceList?.manualPriceProductCount;
  const volume = priceList?.volumePriceProductCount;
  if (typeof manual !== 'number' || typeof volume !== 'number') {
    return undefined;
  }
  return { manual, volume };
}

/** Name of a company list Studio creates, e.g. "Sonora Lab AB SEK". */
export function companyPriceListName(
  companyName: string,
  currency: string,
): string {
  return `${companyName.trim()} ${currency}`;
}

/**
 * Identifier of a company list Studio creates, e.g. "10234-SEK". A list's
 * `identifier` is for external references, so it only exists when the company
 * has an `externalId`.
 */
export function companyPriceListIdentifier(
  externalId: string | undefined,
  currency: string,
): string | undefined {
  const id = externalId?.trim();
  return id ? `${id}-${currency}` : undefined;
}
