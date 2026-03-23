import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  EntityBase,
  Tooltip,
} from './Global';

// =============================================================================
// Shared Domain Types (used by Channel, Account Store, etc.)
// =============================================================================

export type ChannelType = 'webshop' | 'physical' | 'other';

export interface CurrencySymbol {
  value: string;
  prefixed: boolean;
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

export interface Market extends EntityBase {
  channelId: number;
  country: Country;
  currency: Currency;
  virtual: boolean;
  attributes: string[];
  allowedLanguages: string[];
  defaultLanguage: string;
  group?: string;
  active: boolean;
}

// =============================================================================
// Channel Detail Sub-Types (only on detail endpoint)
// =============================================================================

/**
 * Payment method assigned to a channel (response shape).
 */
export type ChannelPaymentMethod = ResponseEntity<{
  name: string;
  icon?: string;
  markets: string[];
  customerTypes: string[];
  customerGroups: string[];
  active: boolean;
}>;

/**
 * Mail template entry for a channel.
 */
export type ChannelMailType = ResponseEntity<{
  typeId: number;
  name: string;
  active: boolean;
}>;

/**
 * General and layout settings for channel email templates.
 */
export interface ChannelMailSettings {
  displayName: string;
  fromEmailAddress: string;
  loginUrl: string;
  passwordResetUrl: string;
  orderConfirmationBCCEmail?: string;
  logoUrl?: string;
  logoSecondaryUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontUrl?: string;
}

// =============================================================================
// Assignment Types (Write / PATCH)
// =============================================================================

/**
 * Language assignment for channel updates (ordered; first = default).
 */
export interface ChannelLanguageAssignment extends EntityBase {
  active: boolean;
}

/**
 * Market assignment for channel updates (ordered; first = default).
 */
export interface ChannelMarketAssignment extends EntityBase {
  active: boolean;
}

/**
 * Payment method assignment for channel updates.
 */
export interface ChannelPaymentMethodAssignment extends EntityBase {
  active: boolean;
}

// =============================================================================
// Channel CRUD Types
// =============================================================================

/**
 * Core channel identity fields shared across Create, Update, and Response types.
 * Kept slim so ChannelCreate/ChannelUpdate don't inherit markets/languages.
 */
export interface ChannelBase {
  name: string;
  displayName: string;
  url: string;
  location: string;
  type: ChannelType;
  active: boolean;
}

/**
 * POST body for creating a new channel.
 */
export type ChannelCreate = CreateEntity<ChannelBase>;

/**
 * PATCH body for updating a channel.
 * Languages and markets are ordered arrays — the first item is the default.
 */
export interface ChannelUpdate extends UpdateEntity<ChannelBase> {
  languages?: ChannelLanguageAssignment[];
  markets?: ChannelMarketAssignment[];
  paymentMethods?: ChannelPaymentMethodAssignment[];
  mailSettings?: Partial<ChannelMailSettings>;
  storefrontSettings?: Record<string, unknown>;
  storefrontSchema?: Record<string, unknown>;
}

/**
 * API list response item (GET /account/channel/list).
 * Also used by the account store for channel context.
 */
export interface ChannelListItem extends ResponseEntity<ChannelBase> {
  markets: Market[];
  defaultMarket: number;
  languages: Language[];
}

/**
 * Table row shape for the channel list page.
 * Markets and languages are transformed to Tooltip for display.
 * Follows the CustomerCompanyList pattern.
 */
export interface ChannelList
  extends Omit<ChannelListItem, 'markets' | 'languages'> {
  markets: Tooltip;
  languages: Tooltip;
}

/**
 * Full channel API response shape (GET /account/channel/{id}).
 * Extends the list item with detail-only fields.
 */
export interface Channel extends ChannelListItem {
  paymentMethods: ChannelPaymentMethod[];
  mailSettings: ChannelMailSettings;
  mailTypes: ChannelMailType[];
  storefrontSettings: Record<string, unknown>;
  storefrontSchema: Record<string, unknown>;
}
