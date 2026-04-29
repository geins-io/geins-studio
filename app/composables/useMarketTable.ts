import type { ChannelMarket, ChannelMarketRow } from '#shared/types';

interface UseMarketTableReturnType {
  toMarketRows: (markets: ChannelMarket[]) => ChannelMarketRow[];
  getBaseColumnTitles: () => Record<string, string>;
}

export function useMarketTable(): UseMarketTableReturnType {
  const { t } = useI18n();

  const toMarketRows = (markets: ChannelMarket[]): ChannelMarketRow[] => {
    return markets.map((m) => ({
      _id: m._id,
      country: {
        code: m.country?._id ?? '',
        label: m.country?.name ?? m._id,
      },
      currency: m.currency?._id ?? '—',
      vatRate: m.standardVatRate || '—',
      active: m.active,
    }));
  };

  const getBaseColumnTitles = () => ({
    country: t('country'),
    currency: t('channels.market_currency'),
    vatRate: t('channels.market_vat_rate'),
  });

  return { toMarketRows, getBaseColumnTitles };
}
