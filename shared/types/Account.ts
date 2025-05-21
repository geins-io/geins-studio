export type ChannelType = 'webshop' | 'physical' | 'other';

export interface Channel extends EntityBase {
  name: string;
  displayName: string;
  location: string;
  type: ChannelType;
  active: boolean;
  markets: Market[];
  defaultMarket: number;
  languages: Language[];
}

export interface Market extends EntityBase {
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

export interface Country extends EntityBase {
  name: string;
  active: boolean;
}

export interface Language extends EntityBase {
  name: string;
  active: boolean;
}

export interface Currency extends EntityBase {
  name: string;
  symbol: CurrencySymbol;
  conversionRate: number;
}

export interface CurrencySymbol {
  value: string;
  prefixed: boolean;
}

export interface Account extends EntityBase {
  accountKey: string;
  name: string;
  defaultCurrency: string;
}
