import type { ChannelMarket, ChannelMarketAssignment } from '#shared/types';
import { nextId } from './ids';

export function buildChannelMarket(
  overrides?: Partial<ChannelMarket>,
): ChannelMarket {
  return {
    _id: nextId('market'),
    _type: 'market',
    country: 'SE',
    currency: 'SEK',
    vat: 25,
    group: 'nordic',
    active: true,
    ...overrides,
  };
}

export function buildChannelMarketAssignment(
  overrides?: Partial<ChannelMarketAssignment>,
): ChannelMarketAssignment {
  return {
    _id: nextId('market'),
    _type: 'market',
    active: true,
    ...overrides,
  };
}
