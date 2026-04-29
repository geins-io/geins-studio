import type {
  ChannelPaymentMethod,
  ChannelPaymentMethodAssignment,
} from '#shared/types';
import { nextId } from './ids';

export function buildChannelPaymentMethod(
  overrides?: Partial<ChannelPaymentMethod>,
): ChannelPaymentMethod {
  return {
    _id: nextId('payment'),
    _type: 'paymentMethod',
    name: 'Invoice',
    identifier: 'invoice',
    markets: ['SE'],
    customerTypes: ['b2b'],
    active: true,
    ...overrides,
  };
}

export function buildChannelPaymentMethodAssignment(
  overrides?: Partial<ChannelPaymentMethodAssignment>,
): ChannelPaymentMethodAssignment {
  return {
    _id: nextId('payment'),
    active: true,
    ...overrides,
  };
}
