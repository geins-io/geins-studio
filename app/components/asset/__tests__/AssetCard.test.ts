import { describe, it, expect } from 'vitest';
import { buildAsset } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';
import { AssetCard, AssetActionsMenu } from '#components';

describe('AssetCard', () => {
  it('renders the asset name and folder', async () => {
    const card = await mountWithContext(AssetCard, {
      props: {
        asset: buildAsset({ name: 'hero.jpg' }),
        folderName: 'Marketing',
      },
    });
    expect(card.text()).toContain('hero.jpg');
    expect(card.text()).toContain('Marketing');
  });

  it('emits open when the name is clicked', async () => {
    const card = await mountWithContext(AssetCard, {
      props: { asset: buildAsset() },
    });
    await card.find('button.link-text').trigger('click');
    expect(card.emitted('open')).toHaveLength(1);
  });

  it('re-emits the shared actions menu events', async () => {
    const card = await mountWithContext(AssetCard, {
      props: { asset: buildAsset() },
    });
    const menu = card.findComponent(AssetActionsMenu);
    menu.vm.$emit('download');
    menu.vm.$emit('copyUrl');
    menu.vm.$emit('delete');
    menu.vm.$emit('open');
    expect(card.emitted('download')).toHaveLength(1);
    expect(card.emitted('copyUrl')).toHaveLength(1);
    expect(card.emitted('delete')).toHaveLength(1);
    expect(card.emitted('open')).toHaveLength(1);
  });

  it('renders a selection checkbox and hides the actions menu in picker mode', async () => {
    const card = await mountWithContext(AssetCard, {
      props: { asset: buildAsset(), selectable: true, hideActions: true },
    });
    expect(card.find('[data-slot="checkbox"]').exists()).toBe(true);
    expect(card.findComponent(AssetActionsMenu).exists()).toBe(false);
  });

  it('emits toggle-select instead of open when the tile is clicked in picker mode', async () => {
    const card = await mountWithContext(AssetCard, {
      props: { asset: buildAsset(), selectable: true },
    });
    await card.find('button.link-text').trigger('click');
    expect(card.emitted('toggleSelect')).toHaveLength(1);
    expect(card.emitted('open')).toBeUndefined();
  });

  it('does not render a checkbox in the default (library) mode', async () => {
    const card = await mountWithContext(AssetCard, {
      props: { asset: buildAsset() },
    });
    expect(card.find('[data-slot="checkbox"]').exists()).toBe(false);
  });
});
