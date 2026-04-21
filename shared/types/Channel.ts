import type { ApiOptions } from './Api';
import type {
  CreateEntity,
  UpdateEntity,
  ResponseEntity,
  EntityBase,
  FlagText,
  Tooltip,
} from './Global';
import type { StorefrontSchema, StorefrontSettings } from './Storefront';

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
  country: Country;
  currency: Currency;
  active: boolean;
  standardVatRate: number;
}

/**
 * Table row shape for market tables (default & additional markets).
 */
export interface ChannelMarketRow {
  _id: string;
  country: FlagText;
  currency: string;
  vatRate: number | string;
  active: boolean;
}

/**
 * Market attached to a channel (GET /account/channel/{id}/market/list).
 * Extends the base Market with channel-specific fields: routing, language settings, and grouping.
 */
export interface ChannelMarket extends Market {
  channelId: number;
  virtual: boolean;
  attributes: string[];
  allowedLanguages: string[];
  defaultLanguage: string;
  group?: string;
}

// =============================================================================
// Channel Detail Sub-Types (only on detail endpoint)
// =============================================================================

/**
 * Payment method assigned to a channel (response shape).
 */
export type ChannelPaymentMethod = ResponseEntity<{
  name: string;
  identifier: string;
  icon?: string;
  markets: string[];
  customerTypes: string[];
  active: boolean;
}>;

export type MailCategory = 'Order' | 'Customer' | 'Product';

/**
 * Mail template metadata for a channel (from `mailTypes` field on channel
 * detail response).
 */
export type ChannelMailType = ResponseEntity<{
  name: string;
  category: MailCategory;
  hasOverrides: boolean;
  active: boolean;
}>;

/**
 * General + layout settings for a channel's email templates.
 * Flat shape matching `account_request_updateChannelMailSettings`.
 * All fields optional; API allows null to clear.
 */
export interface ChannelMailSettings {
  // General
  displayName?: string | null;
  fromEmailAddress?: string | null;
  disabled?: boolean | null;
  locale?: string | null;
  loginUrl?: string | null;
  passwordResetUrl?: string | null;
  orderConfirmationBCCEmail?: string | null;
  externalSourceVerificationTag?: string | null;
  emailReplyToCustomer?: boolean | null;
  orderConfirmationExternalSource?: string | null;
  // Colors
  backgroundColor?: string | null;
  bodyColor?: string | null;
  secondBodyColor?: string | null;
  headerColor?: string | null;
  footerColor?: string | null;
  footerTextColor?: string | null;
  textColor?: string | null;
  saleTextColor?: string | null;
  notIncludedTextColor?: string | null;
  previouslyShippedTextColor?: string | null;
  backOrderedTextColor?: string | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  // Typography
  fontFamily?: string | null;
  fontUrl?: string | null;
  fontSizeSmall?: string | null;
  fontSizeMedium?: string | null;
  fontSizeLarge?: string | null;
  lineHeight?: string | null;
  borderRadius?: string | null;
  // Images — string on read, File when staged for multipart upload via
  // `mailSettings.logoUrl` / `mailSettings.headerImgUrl` parts.
  logoUrl?: string | File | null;
  headerImgUrl?: string | File | null;
  // Product display
  prodImgSize?: string | null;
  showBrand?: boolean | null;
  productParameters?: string | null;
  hideArticleNumber?: boolean | null;
}

/**
 * Mail text override editing — dedicated endpoints outside the channel PATCH surface.
 * `GET/PATCH /account/channel/{id}/mail/{mailType}` and `POST .../preview`.
 */
export interface MailTextEntry {
  key: string;
  defaultValue: string;
  overrideValue: string | null;
  isOverridden: boolean;
  variables?: string[];
}

export type MailTextsResponse = ResponseEntity<{
  language: string;
  texts: MailTextEntry[];
}>;

/**
 * PATCH body. `texts` is a flat map of `{ [key]: overrideValue }`.
 * Empty string values revert to default. Omitted keys are untouched.
 */
export interface MailTextsUpdateRequest {
  language: string;
  texts: Record<string, string>;
}



// =============================================================================
// Assignment Types (Write / PATCH)
// =============================================================================

/**
 * Language assignment for channel updates (ordered; first = default).
 */
export interface ChannelLanguageAssignment extends Omit<EntityBase, '_type'> {
  active: boolean;
}

/**
 * Market assignment for channel updates (ordered; first = default).
 */
export interface ChannelMarketAssignment extends Omit<EntityBase, '_type'> {
  active: boolean;
}

/**
 * Payment method assignment for channel updates.
 */
export interface ChannelPaymentMethodAssignment extends Omit<
  EntityBase,
  '_type'
> {
  active: boolean;
}

/**
 * Mail type assignment for channel updates. `_id` values are camelCase strings
 * (e.g. `orderConfirmation`) matching the API's enum values.
 */
export interface ChannelMailTypeAssignment extends Omit<EntityBase, '_type'> {
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
  url: string;
  active: boolean;
}

/**
 * POST body for creating a new channel.
 * `identifier` is auto-generated from `name` by the API — not sent in the request.
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
  mailTypes?: ChannelMailTypeAssignment[];
  mailSettings?: Partial<ChannelMailSettings>;
  storefrontSettings?: StorefrontSettings;
  storefrontSchema?: StorefrontSchema;
}

/**
 * API list response item (GET /account/channel/list).
 * Also used by the account store for channel context.
 */
export interface ChannelListItem extends ResponseEntity<ChannelBase> {
  identifier: string;
  channelType: ChannelType;
  markets: ChannelMarket[];
  languages: Language[];
  languageCount: number;
  marketCount: number;
  defaultLanguage: string;
  defaultMarket: string;
  locked: boolean;
  activePaymentCount: number;
  paymentCount: number;
}

/**
 * Table row shape for the channel list page.
 * Markets and languages are transformed to Tooltip for display.
 * Follows the CustomerCompanyList pattern.
 */
export interface ChannelList extends Omit<
  ChannelListItem,
  'markets' | 'languages'
> {
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
  storefrontSettings: StorefrontSettings;
  storefrontSchema: StorefrontSchema;
}

// =============================================================================
// API Options
// =============================================================================

export type ChannelFieldsFilter =
  | 'all'
  | 'default'
  | 'languages'
  | 'markets'
  | 'paymentMethods'
  | 'storefrontSettings'
  | 'storefrontSchema'
  | 'mailSettings'
  | 'mailTypes';

export type ChannelApiOptions = ApiOptions<ChannelFieldsFilter>;
