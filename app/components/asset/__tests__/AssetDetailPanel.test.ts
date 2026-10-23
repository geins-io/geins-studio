/* eslint-disable import/order, import/first */
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { computed } from 'vue';
import type { Asset } from '#shared/types';
import { buildAsset } from '../../../../test/fixtures';

const { assetApi } = vi.hoisted(() => ({
  assetApi: { listTags: vi.fn().mockResolvedValue([]) },
}));

mockNuxtImport('useGeinsRepository', () => () => ({ assetApi }));
mockNuxtImport('useBackgroundJobs', () => () => ({
  movingAssetIds: computed(() => new Set<string>()),
  start: vi.fn(),
}));

import AssetDetailPanel from '../AssetDetailPanel.vue';

// PanelEdit renders inline (the real Sheet teleports out of the wrapper) and
// FormTranslatableField is reduced to its model value — this suite checks what
// the open watcher seeds into the form, not the inputs.
const stubs = {
  PanelEdit: {
    name: 'PanelEditStub',
    props: ['dirty'],
    template: '<div><slot /></div>',
  },
  FormTranslatableField: {
    name: 'TranslatableStub',
    props: ['modelValue'],
    template: '<div />',
  },
  AssetThumbnail: true,
  AssetFolderPicker: true,
  FormInputTagsSearch: true,
  FormInputChannels: true,
  FormInputLanguages: true,
  AssetUsedIn: true,
  AssetReplaceDialog: true,
  DialogDelete: true,
};

const A = buildAsset({
  _id: 'as-a',
  name: 'a.jpg',
  localizations: {
    en: { description: 'A description', altText: 'A alt' },
    sv: { description: 'A beskrivning', altText: 'A alt sv' },
  },
});
const B = buildAsset({ _id: 'as-b', name: 'b.jpg', localizations: {} });
const B_EN = buildAsset({
  _id: 'as-b-en',
  name: 'b-en.jpg',
  localizations: { en: { description: 'B description' } },
});

let mounted: { unmount: () => void }[] = [];
afterEach(() => {
  mounted.forEach((m) => m.unmount());
  mounted = [];
});

async function mountPanel() {
  const panel = await mountSuspended(AssetDetailPanel, {
    props: { asset: null, open: false },
    global: { stubs },
  });
  mounted.push(panel);
  return panel;
}

type Panel = Awaited<ReturnType<typeof mountPanel>>;

async function openWith(panel: Panel, asset: Asset) {
  await panel.setProps({ open: false });
  await panel.setProps({ asset });
  await panel.setProps({ open: true });
  await flushPromises();
}

function localized(panel: Panel) {
  const [description, altText] = panel.findAllComponents({
    name: 'TranslatableStub',
  });
  return {
    description: description?.props('modelValue'),
    altText: altText?.props('modelValue'),
  };
}

describe('AssetDetailPanel — reopening for another asset', () => {
  it("doesn't carry the previous asset's description and alt text", async () => {
    const panel = await mountPanel();
    await openWith(panel, A);
    expect(localized(panel)).toEqual({
      description: { en: 'A description', sv: 'A beskrivning' },
      altText: { en: 'A alt', sv: 'A alt sv' },
    });

    await openWith(panel, B);
    expect(localized(panel)).toEqual({ description: {}, altText: {} });
  });

  it("keeps only the new asset's locales", async () => {
    const panel = await mountPanel();
    await openWith(panel, A);
    await openWith(panel, B_EN);
    expect(localized(panel)).toEqual({
      description: { en: 'B description' },
      altText: {},
    });
  });

  it('opens clean after the reset and still tracks edits', async () => {
    const panel = await mountPanel();
    await openWith(panel, A);
    await openWith(panel, B);
    const dirty = () =>
      panel.findComponent({ name: 'PanelEditStub' }).props('dirty');
    expect(dirty()).toBe(false);

    panel
      .findComponent({ name: 'TranslatableStub' })
      .vm.$emit('update:modelValue', { en: 'New description' });
    await flushPromises();
    expect(dirty()).toBe(true);
  });
});
