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
    icon: 'invoice-icon',
    markets: ['SE'],
    customerTypes: ['b2b'],
    customerGroups: ['wholesale'],
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
