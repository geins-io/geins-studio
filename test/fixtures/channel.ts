import type {
  Channel,
  ChannelListItem,
  ChannelCreate,
  ChannelUpdate,
} from '#shared/types';
import { nextId } from './ids';
import { buildChannelLanguage } from './language';
import { buildMailSettings, buildMailType } from './mail';
import { buildChannelMarket } from './market';
import { buildChannelPaymentMethod } from './payment';

export function buildChannelListItem(
  overrides?: Partial<ChannelListItem>,
): ChannelListItem {
  return {
    _id: nextId('ch'),
    _type: 'channel',
    name: 'test-channel',
    displayName: 'Test Channel',
    url: 'www.test-channel.com',
    channelType: 'webshop',
    active: true,
    markets: [buildChannelMarket()],
    languages: [buildChannelLanguage()],
    languageCount: 1,
    marketCount: 1,
    defaultLanguage: 'en',
    defaultMarket: '1',
    locked: false,
    ...overrides,
  };
}

export function buildChannel(overrides?: Partial<Channel>): Channel {
  const listItem = buildChannelListItem();
  return {
    ...listItem,
    paymentMethods: [buildChannelPaymentMethod()],
    mailSettings: buildMailSettings(),
    mailTypes: [buildMailType()],
    storefrontSettings: {},
    storefrontSchema: {},
    ...overrides,
  };
}

export function buildChannelCreate(
  overrides?: Partial<ChannelCreate>,
): ChannelCreate {
  return {
    displayName: 'New Channel',
    url: 'www.new-channel.com',
    channelType: 'webshop',
    active: true,
    ...overrides,
  };
}

export function buildChannelUpdate(
  overrides?: Partial<ChannelUpdate>,
): ChannelUpdate {
  return {
    displayName: 'Updated Channel',
    ...overrides,
  };
}
