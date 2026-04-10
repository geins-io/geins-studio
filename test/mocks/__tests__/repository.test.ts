// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createMockRepository } from '../repository';

describe('createMockRepository', () => {
  it('returns all expected top-level API objects', () => {
    const mock = createMockRepository();
    expect(mock.useGeinsRepository).toBeDefined();
    expect(mock.accountApi).toBeDefined();
    expect(mock.orderApi).toBeDefined();
    expect(mock.customerApi).toBeDefined();
    expect(mock.productApi).toBeDefined();
    expect(mock.globalApi).toBeDefined();
  });

  it('useGeinsRepository returns all API objects when called', () => {
    const mock = createMockRepository();
    const result = mock.useGeinsRepository();
    expect(result.accountApi).toBe(mock.accountApi);
    expect(result.orderApi).toBe(mock.orderApi);
    expect(result.customerApi).toBe(mock.customerApi);
    expect(result.productApi).toBe(mock.productApi);
    expect(result.globalApi).toBe(mock.globalApi);
  });

  it('accountApi.channel.get is a callable mock function', () => {
    const { accountApi } = createMockRepository();
    expect(vi.isMockFunction(accountApi.channel.get)).toBe(true);
    accountApi.channel.get.mockResolvedValue({ _id: '1' });
    expect(accountApi.channel.get).not.toHaveBeenCalled();
  });

  it('accountApi.channel.id returns nested mock object', () => {
    const { accountApi } = createMockRepository();
    const nested = accountApi.channel.id('123');
    expect(vi.isMockFunction(nested.market.list)).toBe(true);
    expect(vi.isMockFunction(nested.payment.list)).toBe(true);
    expect(vi.isMockFunction(nested.payment.get)).toBe(true);
    expect(vi.isMockFunction(nested.mail.getTexts)).toBe(true);
    expect(vi.isMockFunction(nested.mail.updateTexts)).toBe(true);
    expect(vi.isMockFunction(nested.mail.preview)).toBe(true);
  });

  it('accountApi has top-level sub-resource methods', () => {
    const { accountApi } = createMockRepository();
    expect(vi.isMockFunction(accountApi.currency.list)).toBe(true);
    expect(vi.isMockFunction(accountApi.language.list)).toBe(true);
    expect(vi.isMockFunction(accountApi.language.get)).toBe(true);
    expect(vi.isMockFunction(accountApi.market.list)).toBe(true);
    expect(vi.isMockFunction(accountApi.payment.list)).toBe(true);
  });

  it('accountApi.channel has all CRUD + action methods', () => {
    const { accountApi } = createMockRepository();
    expect(vi.isMockFunction(accountApi.channel.list)).toBe(true);
    expect(vi.isMockFunction(accountApi.channel.get)).toBe(true);
    expect(vi.isMockFunction(accountApi.channel.create)).toBe(true);
    expect(vi.isMockFunction(accountApi.channel.update)).toBe(true);
    expect(vi.isMockFunction(accountApi.channel.activate)).toBe(true);
    expect(vi.isMockFunction(accountApi.channel.deactivate)).toBe(true);
  });

  it('each call returns independent mock instances (no shared state)', () => {
    const mock1 = createMockRepository();
    const mock2 = createMockRepository();

    // Different vi.fn instances
    expect(mock1.accountApi.channel.get).not.toBe(mock2.accountApi.channel.get);
    expect(mock1.orderApi.quotation.get).not.toBe(mock2.orderApi.quotation.get);
    expect(mock1.useGeinsRepository).not.toBe(mock2.useGeinsRepository);

    // Calling one doesn't affect the other
    mock1.accountApi.channel.get('test');
    expect(mock1.accountApi.channel.get).toHaveBeenCalledTimes(1);
    expect(mock2.accountApi.channel.get).toHaveBeenCalledTimes(0);
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
