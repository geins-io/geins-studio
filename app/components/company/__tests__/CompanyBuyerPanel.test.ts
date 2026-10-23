/* eslint-disable import/order, import/first */
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CompanyBuyerUpdate } from '#shared/types';

const { customerApi } = vi.hoisted(() => ({
  customerApi: { customer: { get: vi.fn() } },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ customerApi }));

import CompanyBuyerPanel from '../CompanyBuyerPanel.vue';

// PanelEdit renders inline — the real Sheet teleports out of the wrapper.
const stubs = {
  PanelEdit: { template: '<div><slot /></div>' },
};

const ANNA: CompanyBuyerUpdate = {
  _id: 'anna@example.com',
  firstName: 'Anna',
  lastName: 'Andersson',
  phone: '+46 70 000 00 00',
  active: true,
  priceLists: [],
};

let mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.forEach((m) => m.unmount());
  mounted = [];
});

async function mountPanel() {
  const panel = await mountSuspended(CompanyBuyerPanel, {
    props: {
      open: false,
      mode: 'add',
      buyer: undefined,
      companyId: 'c1',
      companyName: 'Acme',
      priceLists: [],
    },
    global: { stubs },
  });
  mounted.push(panel);
  return panel;
}

type Panel = Awaited<ReturnType<typeof mountPanel>>;

async function openWith(
  panel: Panel,
  mode: 'add' | 'edit',
  buyer?: CompanyBuyerUpdate,
) {
  await panel.setProps({ open: false });
  await panel.setProps({ mode, buyer });
  await panel.setProps({ open: true });
  await flushPromises();
}

const field = (panel: Panel, autocomplete: string) =>
  (
    panel.find(`input[autocomplete="${autocomplete}"]`)
      .element as HTMLInputElement
  ).value;

describe('CompanyBuyerPanel — reopening for another buyer', () => {
  it("starts an add with none of the previously edited buyer's fields", async () => {
    const panel = await mountPanel();
    await openWith(panel, 'edit', ANNA);
    expect(field(panel, 'given-name')).toBe('Anna');
    expect(field(panel, 'tel')).toBe('+46 70 000 00 00');

    await openWith(panel, 'add');
    expect(field(panel, 'given-name')).toBe('');
    expect(field(panel, 'family-name')).toBe('');
    expect(field(panel, 'email')).toBe('');
    expect(field(panel, 'tel')).toBe('');
  });

  it("drops fields the next buyer doesn't have", async () => {
    const panel = await mountPanel();
    await openWith(panel, 'edit', ANNA);
    await openWith(panel, 'edit', {
      _id: 'bo@example.com',
      firstName: 'Bo',
      active: true,
    });
    expect(field(panel, 'given-name')).toBe('Bo');
    expect(field(panel, 'family-name')).toBe('');
    expect(field(panel, 'tel')).toBe('');
  });
});
