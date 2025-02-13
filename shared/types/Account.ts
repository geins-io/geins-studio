// TODO: move all types to shared folder (Nuxt 3.14)

export type ChannelType = 'webshop' | 'physical' | 'other';

export interface Channel {
  id: number;
  name: string;
  displayName: string;
  location: string;
  type: ChannelType;
  active: boolean;
  markets: Market[];
  defaultMarket: number;
  languages: Language[];
}

export interface Market {
  id: number;
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

export interface Country {
  id: number;
  name: string;
  active: boolean;
}

export interface Language {
  id: string;
  name: string;
  active: boolean;
}

export interface Currency {
  id: string;
  name: string;
  symbol: CurrencySymbol;
  conversionRate: number;
}

export interface CurrencySymbol {
  id: number;
  value: string;
  prefixed: boolean;
}

export interface Account {
  id: number;
  accountKey: string;
  name: string;
  defaultCurrency: string;
}
