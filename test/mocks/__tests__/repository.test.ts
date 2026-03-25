// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createMockRepository } from '../repository';

describe('createMockRepository', () => {
  it('returns all expected top-level API objects', () => {
    const mock = createMockRepository();
    expect(mock.useGeinsRepository).toBeDefined();
    expect(mock.channelApi).toBeDefined();
    expect(mock.orderApi).toBeDefined();
    expect(mock.customerApi).toBeDefined();
    expect(mock.productApi).toBeDefined();
    expect(mock.globalApi).toBeDefined();
  });

  it('useGeinsRepository returns all API objects when called', () => {
    const mock = createMockRepository();
    const result = mock.useGeinsRepository();
    expect(result.channelApi).toBe(mock.channelApi);
    expect(result.orderApi).toBe(mock.orderApi);
    expect(result.customerApi).toBe(mock.customerApi);
    expect(result.productApi).toBe(mock.productApi);
    expect(result.globalApi).toBe(mock.globalApi);
  });

  it('channelApi.channel.get is a callable mock function', () => {
    const { channelApi } = createMockRepository();
    expect(vi.isMockFunction(channelApi.channel.get)).toBe(true);
    channelApi.channel.get.mockResolvedValue({ _id: '1' });
    expect(channelApi.channel.get).not.toHaveBeenCalled();
  });

  it('channelApi.channel.id returns nested mock object', () => {
    const { channelApi } = createMockRepository();
    const nested = channelApi.channel.id('123');
    expect(vi.isMockFunction(nested.market.list)).toBe(true);
    expect(vi.isMockFunction(nested.payment.list)).toBe(true);
    expect(vi.isMockFunction(nested.payment.get)).toBe(true);
    expect(vi.isMockFunction(nested.mail.getTexts)).toBe(true);
    expect(vi.isMockFunction(nested.mail.updateTexts)).toBe(true);
    expect(vi.isMockFunction(nested.mail.preview)).toBe(true);
  });

  it('channelApi has top-level sub-resource methods', () => {
    const { channelApi } = createMockRepository();
    expect(vi.isMockFunction(channelApi.market.list)).toBe(true);
    expect(vi.isMockFunction(channelApi.language.list)).toBe(true);
    expect(vi.isMockFunction(channelApi.language.get)).toBe(true);
    expect(vi.isMockFunction(channelApi.payment.list)).toBe(true);
  });

  it('channelApi.channel has all CRUD + action methods', () => {
    const { channelApi } = createMockRepository();
    expect(vi.isMockFunction(channelApi.channel.list)).toBe(true);
    expect(vi.isMockFunction(channelApi.channel.get)).toBe(true);
    expect(vi.isMockFunction(channelApi.channel.create)).toBe(true);
    expect(vi.isMockFunction(channelApi.channel.update)).toBe(true);
    expect(vi.isMockFunction(channelApi.channel.activate)).toBe(true);
    expect(vi.isMockFunction(channelApi.channel.deactivate)).toBe(true);
  });

  it('each call returns independent mock instances (no shared state)', () => {
    const mock1 = createMockRepository();
    const mock2 = createMockRepository();

    // Different vi.fn instances
    expect(mock1.channelApi.channel.get).not.toBe(mock2.channelApi.channel.get);
    expect(mock1.orderApi.quotation.get).not.toBe(mock2.orderApi.quotation.get);
    expect(mock1.useGeinsRepository).not.toBe(mock2.useGeinsRepository);

    // Calling one doesn't affect the other
    mock1.channelApi.channel.get('test');
    expect(mock1.channelApi.channel.get).toHaveBeenCalledTimes(1);
    expect(mock2.channelApi.channel.get).toHaveBeenCalledTimes(0);
  });

  it('other APIs have expected minimal stubs', () => {
    const { orderApi, customerApi, productApi, globalApi } =
      createMockRepository();

    // orderApi
    expect(vi.isMockFunction(orderApi.quotation.get)).toBe(true);
    expect(vi.isMockFunction(orderApi.quotation.list)).toBe(true);

    // customerApi
    expect(vi.isMockFunction(customerApi.company.get)).toBe(true);
    expect(vi.isMockFunction(customerApi.company.list)).toBe(true);

    // productApi
    expect(vi.isMockFunction(productApi.get)).toBe(true);
    expect(vi.isMockFunction(productApi.list)).toBe(true);

    // globalApi
    expect(vi.isMockFunction(globalApi.account.get)).toBe(true);
    expect(vi.isMockFunction(globalApi.channel.list)).toBe(true);
    expect(vi.isMockFunction(globalApi.currency.list)).toBe(true);
    expect(vi.isMockFunction(globalApi.language.list)).toBe(true);
  });
});
