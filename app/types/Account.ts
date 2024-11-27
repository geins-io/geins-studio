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
  country?: Country | string;
  currency?: Currency | string;
  virtual: boolean;
  attributes: string[];
  allowedLanguages: string[];
  defaultLanguage: string;
  group?: string;
  active: boolean;
}

export interface Country {
  id: string;
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
  value: string;
  prefixed: boolean;
}
