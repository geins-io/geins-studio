import type {
  ChannelMailSettings,
  ChannelMailType,
  MailTextEntry,
  MailTextsResponse,
} from '#shared/types';

export function buildMailSettings(
  overrides?: Partial<ChannelMailSettings>,
): ChannelMailSettings {
  return {
    displayName: 'Test Store',
    fromEmailAddress: 'no-reply@test.com',
    loginUrl: 'https://test.com/login',
    passwordResetUrl: 'https://test.com/reset',
    orderConfirmationBCCEmail: 'orders@test.com',
    logoUrl: 'https://test.com/logo.png',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial',
    ...overrides,
  };
}

export function buildMailType(
  overrides?: Partial<ChannelMailType>,
): ChannelMailType {
  return {
    _id: 'orderConfirmation',
    _type: 'ChannelMailType',
    name: 'Order Confirmation',
    category: 'Order',
    hasOverrides: false,
    active: true,
    ...overrides,
  };
}

export function buildMailTextEntry(
  overrides?: Partial<MailTextEntry>,
): MailTextEntry {
  return {
    key: 'SUBJECT',
    defaultValue: 'Your order confirmation',
    overrideValue: null,
    isOverridden: false,
    ...overrides,
  };
}

export function buildMailTextsResponse(
  overrides?: Partial<MailTextsResponse>,
): MailTextsResponse {
  return {
    _id: 'orderConfirmation',
    _type: 'MailTexts',
    language: 'en',
    texts: [buildMailTextEntry()],
    ...overrides,
  };
}
