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
    location: 'www.test-channel.com',
    type: 'webshop',
    active: true,
    markets: [buildChannelMarket()],
    defaultMarket: 1,
    languages: [buildChannelLanguage()],
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
    name: 'new-channel',
    displayName: 'New Channel',
    url: 'www.new-channel.com',
    location: 'www.new-channel.com',
    type: 'webshop',
    active: true,
    ...overrides,
  };
}

export function buildChannelUpdate(
  overrides?: Partial<ChannelUpdate>,
): ChannelUpdate {
  return {
    name: 'updated-channel',
    displayName: 'Updated Channel',
    ...overrides,
  };
}
