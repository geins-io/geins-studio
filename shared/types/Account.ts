import type { GeinsEntity } from '#shared/types';

export type ChannelType = 'webshop' | 'physical' | 'other';

export interface Channel extends GeinsEntity {
  name: string;
  displayName: string;
  location: string;
  type: ChannelType;
  active: boolean;
  markets: Market[];
  defaultMarket: number;
  languages: Language[];
}

export interface Market extends GeinsEntity {
  channelId: number;
  country?: Country;
  currency?: Currency;
  virtual: boolean;
  attributes: string[];
  allowedLanguages: string[];
  defaultLanguage: string;
  group?: string;
  active: boolean;
}

export interface Country extends GeinsEntity {
  name: string;
  active: boolean;
}

export interface Language extends GeinsEntity {
  name: string;
  active: boolean;
}

export interface Currency extends GeinsEntity {
  name: string;
  symbol: CurrencySymbol;
  conversionRate: number;
}

export interface CurrencySymbol {
  value: string;
  prefixed: boolean;
}

export interface Account extends GeinsEntity {
  accountKey: string;
  name: string;
  defaultCurrency: string;
}
