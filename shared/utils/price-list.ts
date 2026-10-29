import type {
  PriceListContent,
  PriceListPriceMode,
  PriceListProduct,
  PriceListRule,
  PriceListRuleField,
  ProductPriceList,
  ProductPriceListCreate,
  ProductPriceListUpdate,
} from '#shared/types';

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
  | 'update'
  | 'activate'
  | 'deactivate'
  | 'none';

/**
 * What "Save company" does to the company's own list for the switch state
 * `enabled`. Off keeps the list (and its prices) and only deactivates it.
 * Edited content makes it an `update`, which also carries an `active` change.
 * A read-only (ERP) list is never saved: `PATCH` on it answers 422.
 */
export function getCompanyPriceListSaveAction(
  priceList: Pick<ProductPriceList, 'active' | 'readOnly'> | undefined,
  enabled: boolean,
  contentDirty = false,
): CompanyPriceListSaveAction {
  if (!priceList) return enabled ? 'create' : 'none';
  if (priceList.readOnly) return 'none';
  if (contentDirty) return 'update';
  if (priceList.active === enabled) return 'none';
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

/**
 * Name of a company list Studio creates, e.g. "Sonora Lab AB SEK", or
 * "Sonora Lab AB Sweden SEK" with the `channelName` of a multi-channel company.
 */
export function companyPriceListName(
  companyName: string,
  currency: string,
  channelName?: string,
): string {
  return [companyName.trim(), channelName?.trim(), currency]
    .filter(Boolean)
    .join(' ');
}

/**
 * Identifier of a company list Studio creates, e.g. "10234-SEK", or
 * "10234-1-SEK" with the `channel` id of a multi-channel company. A list's
 * `identifier` is for external references, so it only exists when the company
 * has an `externalId`.
 */
export function companyPriceListIdentifier(
  externalId: string | undefined,
  currency: string,
  channel?: string,
): string | undefined {
  const id = externalId?.trim();
  return id ? [id, channel, currency].filter(Boolean).join('-') : undefined;
}

type PriceListSlot = Pick<ProductPriceList, 'channel' | 'currency'>;

export interface FreeCompanyPriceListSlot {
  channel: string;
  currencies: string[];
}

/**
 * The channel and currency slots where the company can still get a list of its
 * own: an account owns at most one per slot. `taken` holds its saved lists (ERP
 * and Studio-managed) and unsaved drafts. Channels with no free currency are
 * left out; currencies keep `getCurrencies`' order.
 */
export function getFreeCompanyPriceListSlots(
  channels: string[],
  getCurrencies: (channel: string) => string[],
  taken: PriceListSlot[],
): FreeCompanyPriceListSlot[] {
  return channels
    .map((channel) => ({
      channel,
      currencies: getCurrencies(channel).filter(
        (currency) =>
          !taken.some(
            (slot) =>
              String(slot.channel) === String(channel) &&
              slot.currency === currency,
          ),
      ),
    }))
    .filter((slot) => slot.currencies.length > 0);
}

interface CompanyPriceListEntryState {
  /** The server copy; a draft has none yet. */
  saved?: Pick<ProductPriceList, 'active'>;
  active: boolean;
  readOnly: boolean;
  contentDirty: boolean;
}

/**
 * Whether "Save company" has something to save for one of the company's lists:
 * it's an unsaved draft, its switch differs from the saved list, or its content
 * was edited. A read-only (ERP) list never saves.
 */
export function isCompanyPriceListEntryDirty(
  entry: CompanyPriceListEntryState,
): boolean {
  if (entry.readOnly) return false;
  if (!entry.saved) return true;
  return entry.active !== entry.saved.active || entry.contentDirty;
}

const PRICE_FIELDS: PriceListRuleField[] = [
  'price',
  'margin',
  'discountPercent',
];

const PRICE_FIELD_BY_MODE: Partial<
  Record<PriceListPriceMode, PriceListRuleField>
> = {
  fixed: 'price',
  margin: 'margin',
  discount: 'discountPercent',
};

function priceListRuleBody(
  rule: PriceListRule,
  keepId: boolean,
): PriceListRule {
  return {
    ...(keepId && rule._id !== undefined && { _id: rule._id }),
    quantity: rule.quantity,
    ...(rule.margin != null && { margin: rule.margin }),
    ...(rule.discountPercent != null && {
      discountPercent: rule.discountPercent,
    }),
  };
}

/**
 * A manual row targeted by `productId` + `staggeredCount`. A GET row carries
 * all three price fields, so its `priceMode` picks the one to send; a row
 * without a price is a reset to auto.
 */
function priceListProductBody(row: PriceListProduct): PriceListProduct {
  const { productId, staggeredCount } = row;
  if (row.delete) return { productId, staggeredCount, delete: true };
  const field = row.priceMode
    ? PRICE_FIELD_BY_MODE[row.priceMode]
    : PRICE_FIELDS.find((f) => row[f] != null);
  const body: PriceListProduct = { productId, staggeredCount };
  if (field && row[field] != null) body[field] = row[field];
  return body;
}

const hasPrice = (row: PriceListProduct) =>
  PRICE_FIELDS.some((f) => row[f] !== undefined);

function priceListContentBody(
  { rules, productSelectionQuery, products }: PriceListContent,
  create: boolean,
): PriceListContent {
  const rows = products?.map(priceListProductBody);
  return {
    ...(rules && {
      rules: rules.map((rule) => priceListRuleBody(rule, !create)),
    }),
    ...(productSelectionQuery && { productSelectionQuery }),
    // A new list has nothing to reset or delete.
    ...(rows && { products: create ? rows.filter(hasPrice) : rows }),
  };
}

export interface CompanyPriceListCreateOptions {
  companyId: string;
  companyName: string;
  externalId?: string;
  channel: string;
  /**
   * Set when the company has more than one channel: the name then includes it
   * and the identifier the channel id, or two lists in one currency would clash
   * (`409` on the identifier).
   */
  channelName?: string;
  currency: string;
  /** Defaults to `true`; lists are inactive by default on the API. */
  active?: boolean;
  content?: PriceListContent;
}

/** `POST` body for a company's own list, with the edited `content` if any. */
export function companyPriceListCreateBody({
  companyId,
  companyName,
  externalId,
  channel,
  channelName,
  currency,
  active = true,
  content,
}: CompanyPriceListCreateOptions): ProductPriceListCreate {
  return {
    name: companyPriceListName(companyName, currency, channelName),
    identifier: companyPriceListIdentifier(
      externalId,
      currency,
      channelName ? channel : undefined,
    ),
    channel,
    currency,
    wholesaleAccountId: companyId,
    active,
    exVat: true,
    // Only the selection's products, never ones created later; `forced` has no
    // effect on an account list.
    autoAddProducts: false,
    forced: false,
    dateCreated: '',
    ...(content && priceListContentBody(content, true)),
  };
}

/**
 * `PATCH` body for a company's own list: `active` when the switch changed, plus
 * the edited `content`. Rules and the selection replace what's saved, so pass
 * them in full; a content field left `undefined` is kept as saved.
 */
export function companyPriceListUpdateBody(
  priceList: Pick<ProductPriceList, 'active'>,
  enabled: boolean,
  content?: PriceListContent,
): ProductPriceListUpdate {
  return {
    ...(priceList.active !== enabled && { active: enabled }),
    ...(content && priceListContentBody(content, false)),
  };
}
