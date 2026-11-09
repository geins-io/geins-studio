// @vitest-environment node
/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { BatchQueryResult, Order } from '#shared/types';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

mockNuxtImport('useGeinsRepository', () => () => ({ orderApi: { query } }));
mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));
mockNuxtImport('useAccountStore', () => () => ({
  channels: [],
  getChannelNameById: () => '',
}));
mockNuxtImport('useColumns', () => () => ({ getColumns: () => [] }));
mockNuxtImport('useGeinsLog', () => () => ({ geinsLogError: vi.fn() }));

import { useCompanyOrders } from '../orders/useCompanyOrders';

const order: Order = {
  _id: 'o1',
  _type: 'order',
  dateCreated: '2026-10-01T10:00:00Z',
  customerId: 'c1',
  email: 'buyer@example.com',
  sumExVat: 80,
  sumIncVat: 100,
  wholesaleAccountId: 'w1',
  channel: '1|se',
  currency: 'SEK',
  itemCount: 2,
  status: 'completed',
  priceLists: [],
};

const result: BatchQueryResult<Order> = {
  _id: 'q1',
  page: 1,
  pageSize: 10,
  totalItemCount: 1,
  pageCount: 1,
  items: [order],
};

describe('useCompanyOrders().fetchOrders', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('opts out of the global error toast — the query is a read', async () => {
    query.mockResolvedValue(result);
    const { fetchOrders } = useCompanyOrders();

    await fetchOrders();

    expect(query).toHaveBeenCalledWith(expect.any(Object), undefined, {
      suppressErrorToast: true,
    });
  });

  it('flags the error and empties the list when the query fails', async () => {
    query.mockResolvedValueOnce(result);
    const { fetchOrders, ordersList, ordersError, ordersLoading } =
      useCompanyOrders();
    await fetchOrders();
    expect(ordersList.value).toHaveLength(1);

    query.mockRejectedValueOnce({ status: 502, message: 'Bad gateway' });
    await fetchOrders();

    expect(ordersError.value).toBe(true);
    expect(ordersList.value).toEqual([]);
    expect(ordersLoading.value).toBe(false);
  });

  it('clears the error once a retry succeeds', async () => {
    query.mockRejectedValueOnce({ status: 502 });
    const { fetchOrders, ordersList, ordersError } = useCompanyOrders();
    await fetchOrders();
    expect(ordersError.value).toBe(true);

    query.mockResolvedValueOnce(result);
    await fetchOrders();

    expect(ordersError.value).toBe(false);
    expect(ordersList.value.map((o) => o._id)).toEqual(['o1']);
  });
});
