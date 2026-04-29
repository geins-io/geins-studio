import type { ChannelMarket, ChannelMarketAssignment } from '#shared/types';
import { nextId } from './ids';

export function buildChannelMarket(overrides?: Partial<ChannelMarket>): ChannelMarket {
  return {
    _id: nextId('market'),
    _type: 'market',
    channelId: 1,
    country: {
      _id: 'SE',
      _type: 'country',
      name: 'Sweden',
      active: true,
    },
    currency: {
      _id: 'SEK',
      _type: 'currency',
      name: 'Swedish Krona',
      symbol: { value: 'kr', prefixed: false },
      conversionRate: 1,
    },
    virtual: false,
    attributes: [],
    allowedLanguages: ['en', 'sv'],
    defaultLanguage: 'en',
    group: 'nordic',
    active: true,
    standardVatRate: 0.25,
    ...overrides,
  };
}

export function buildChannelMarketAssignment(
  overrides?: Partial<ChannelMarketAssignment>,
): ChannelMarketAssignment {
  return {
    _id: nextId('market'),
    active: true,
    ...overrides,
  };
}
