import type { ChannelType } from './Account';
import type { EntityBase, ResponseEntity } from './Global';

// =============================================================================
// Sub-Entity Types (Response)
// =============================================================================

/**
 * Language assigned to a channel (response shape).
 */
export type ChannelLanguage = ResponseEntity<{
  name: string;
  active: boolean;
}>;

/**
 * Market assigned to a channel (response shape).
 */
export type ChannelMarket = ResponseEntity<{
  country: string;
  currency: string;
  vat?: number;
  group?: string;
  active: boolean;
}>;

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
  // General settings
  displayName: string;
  fromEmailAddress: string;
  loginUrl: string;
  passwordResetUrl: string;
  orderConfirmationBCCEmail?: string;
  // Layout settings
  logoUrl?: string;
  logoSecondaryUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontUrl?: string;
}

// =============================================================================
// Sub-Entity Types (Write / Assignment)
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
 * Full channel API response shape (used by the edit page).
 * Languages and markets are ordered arrays — the first item is the default.
 */
export interface ChannelResponse extends EntityBase {
  name: string;
  displayName: string;
  url: string;
  type: ChannelType;
  active: boolean;
  languages: ChannelLanguage[];
  markets: ChannelMarket[];
  paymentMethods: ChannelPaymentMethod[];
  mailSettings: ChannelMailSettings;
  mailTypes: ChannelMailType[];
  storefrontSettings: Record<string, unknown>;
  storefrontSchema: Record<string, unknown>;
}

/**
 * POST body for creating a new channel.
 */
export interface ChannelCreate {
  name: string;
  displayName: string;
  url: string;
  type: ChannelType;
  active: boolean;
}

/**
 * PATCH body for updating a channel (multipart/form-data JSON part).
 */
export interface ChannelUpdate {
  name?: string;
  displayName?: string;
  url?: string;
  type?: ChannelType;
  active?: boolean;
  languages?: ChannelLanguageAssignment[];
  markets?: ChannelMarketAssignment[];
  paymentMethods?: ChannelPaymentMethodAssignment[];
  mailSettings?: Partial<ChannelMailSettings>;
  storefrontSettings?: Record<string, unknown>;
  storefrontSchema?: Record<string, unknown>;
}

/**
 * Table row shape for the channel list page.
 */
export type ChannelListItem = ResponseEntity<{
  name: string;
  displayName: string;
  url: string;
  type: ChannelType;
  active: boolean;
  marketCount: number;
}>;
