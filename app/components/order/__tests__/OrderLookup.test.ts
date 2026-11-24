/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import type { Order } from '#shared/types';
import { mountWithContext } from '../../../../test/helpers';

const { orderApi } = vi.hoisted(() => ({ orderApi: { query: vi.fn() } }));

mockNuxtImport('useGeinsRepository', () => () => ({ orderApi }));

import OrderLookup from '../OrderLookup.vue';

const buildOrder = (id: string): Order => ({
  _id: id,
  _type: 'geins.order',
  dateCreated: '2026-11-20T10:00:00.000Z',
  customerId: 'buyer@acme.test',
  email: `buyer-${id}@acme.test`,
  sumExVat: 1600,
  sumIncVat: 2000,
  wholesaleAccountId: '7',
  channel: '1',
  currency: 'SEK',
  itemCount: 1,
  status: 'pending',
  priceLists: [],
});

/** Answers a query with the orders whose ids are in `existing`. */
function answerWith(existing: string[]) {
  orderApi.query.mockImplementation(
    async (batch: { include: { selections: { orderIds: string[] }[] }[] }) => {
      const asked = batch.include[0]?.selections[0]?.orderIds ?? [];
      return {
        items: asked.filter((id) => existing.includes(id)).map(buildOrder),
      };
    },
  );
}

const askedIds = (call = 0) =>
  orderApi.query.mock.calls[call]?.[0].include[0].selections[0].orderIds;

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

let mounted: { unmount: () => void }[] = [];
async function mountLookup(linkedIds: string[] = []) {
  const model = ref<Order[]>([]);
  const Host = defineComponent({
    setup: () => () =>
      h(OrderLookup, {
        modelValue: model.value,
        linkedIds,
        'onUpdate:modelValue': (value: Order[]) => (model.value = value),
      }),
  });
  const wrapper = await mountWithContext(Host);
  mounted.push(wrapper);
  const input = wrapper.find('input');
  const find = async (value: string) => {
    await input.setValue(value);
    await wrapper.find('[data-test="order-lookup-find"]').trigger('click');
    await flush();
  };
  const message = () => wrapper.find('[data-test="order-lookup-message"]');
  const ids = () => model.value.map((order) => order._id);
  return { wrapper, model, input, find, message, ids };
}

// Braces: a function returned from `beforeEach` runs as a cleanup hook.
beforeEach(() => {
  orderApi.query.mockReset();
});
afterEach(() => {
  for (const wrapper of mounted) wrapper.unmount();
  mounted = [];
});

describe('OrderLookup', () => {
  it('finds several orders in one query and lists them in typed order', async () => {
    answerWith(['1001', '1002']);
    const { wrapper, input, find, ids, message } = await mountLookup();

    await find(' #001002, 1001 ');

    expect(orderApi.query).toHaveBeenCalledTimes(1);
    expect(askedIds()).toEqual(['1002', '1001']);
    expect(ids()).toEqual(['1002', '1001']);
    expect(wrapper.text()).toContain('buyer-1001@acme.test');
    expect((input.element as HTMLInputElement).value).toBe('');
    expect(message().exists()).toBe(false);
  });

  it('adds to the list on each find and skips orders already listed', async () => {
    answerWith(['1001', '1002']);
    const { find, ids } = await mountLookup();

    await find('1001');
    await find('1001 1002');

    expect(askedIds(1)).toEqual(['1002']);
    expect(ids()).toEqual(['1001', '1002']);
  });

  it('shows a calm row, not an error, for numbers with no order', async () => {
    answerWith(['1001']);
    const { wrapper, find, ids, message } = await mountLookup();

    await find('1001, 1224');

    expect(ids()).toEqual(['1001']);
    expect(message().text()).toContain('orders.order_not_found');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('refuses tokens that are not digits without a request', async () => {
    const { find, message } = await mountLookup();

    await find('12a4');

    expect(orderApi.query).not.toHaveBeenCalled();
    expect(message().text()).toContain('orders.order_number_invalid');
  });

  it('does nothing on Enter in an empty field', async () => {
    const { input, message } = await mountLookup();

    await input.trigger('keydown', { key: 'Enter' });
    await flush();

    expect(orderApi.query).not.toHaveBeenCalled();
    expect(message().exists()).toBe(false);
  });

  it('keeps the numbers and offers a retry when the lookup fails', async () => {
    orderApi.query.mockRejectedValueOnce({ statusCode: 500 });
    const { wrapper, input, find, ids, message } = await mountLookup();

    await find('1001');
    expect(message().exists()).toBe(false);
    expect((input.element as HTMLInputElement).value).toBe('1001');
    const retry = wrapper.find('[role="alert"] button');
    expect(retry.exists()).toBe(true);

    answerWith(['1001']);
    await retry.trigger('click');
    await flush();

    expect(orderApi.query).toHaveBeenCalledTimes(2);
    expect(ids()).toEqual(['1001']);
  });

  it('keeps numbers typed while the lookup ran', async () => {
    let answer!: (value: { items: Order[] }) => void;
    orderApi.query.mockReturnValue(new Promise((r) => (answer = r)));
    const { input, find, ids } = await mountLookup();

    await find('1001');
    await input.setValue('1001, 1002');
    answer({ items: [buildOrder('1001')] });
    await flush();

    expect(ids()).toEqual(['1001']);
    expect((input.element as HTMLInputElement).value).toBe('1001, 1002');
  });

  it('removes an order from the list', async () => {
    answerWith(['1001', '1002']);
    const { wrapper, find, ids } = await mountLookup();

    await find('1001, 1002');
    await wrapper.find('[data-test="order-lookup-remove"]').trigger('click');

    expect(ids()).toEqual(['1002']);
  });

  it('marks orders the caller already links to', async () => {
    answerWith(['1001', '1002']);
    const { wrapper, find } = await mountLookup(['1002']);

    await find('1001, 1002');

    const rows = wrapper.findAll('[data-test="order-lookup-list"] li');
    expect(rows[0]?.text()).not.toContain('asset_library.picker_linked');
    expect(rows[1]?.text()).toContain('asset_library.picker_linked');
  });
});
