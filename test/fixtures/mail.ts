import type { ChannelMailSettings, ChannelMailType } from '#shared/types';
import { nextId } from './ids';

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
    primaryColor: '#000000',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial',
    ...overrides,
  };
}

export function buildMailType(
  overrides?: Partial<ChannelMailType>,
): ChannelMailType {
  return {
    _id: nextId('mail-type'),
    _type: 'mailType',
    typeId: 1,
    name: 'OrderConfirmation',
    active: true,
    ...overrides,
  };
}
