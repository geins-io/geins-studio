import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetBulkLinkProducts } from '#components';

const stubs = { ProductMultiSelect: true };
const summary = () => 'summary';

async function mountPane(composition: 'images' | 'files' | 'mixed') {
  return await mountWithContext(AssetBulkLinkProducts, {
    props: {
      composition,
      summary,
      modelValue: { mode: 'byType', productIds: ['p1'] },
    },
    global: { stubs },
  });
}

describe('AssetBulkLinkProducts', () => {
  it('offers Image or File for an images-only selection', async () => {
    const pane = await mountPane('images');
    expect(pane.findAll('[role="radio"]')).toHaveLength(2);
    expect(pane.text()).toContain('asset_library.asset_type.image');
    expect(pane.find('[data-test="bulk-link-split-hint"]').exists()).toBe(
      false,
    );
  });

  it('shows no Link as choice when nothing is an image', async () => {
    const pane = await mountPane('files');
    expect(pane.findAll('[role="radio"]')).toHaveLength(0);
    expect(pane.text()).not.toContain('asset_library.link_as');
  });

  it('offers by type or all as file, and explains the split, when mixed', async () => {
    const pane = await mountPane('mixed');
    expect(pane.findAll('[role="radio"]')).toHaveLength(2);
    expect(pane.text()).toContain('asset_library.bulk_link_by_type');
    expect(pane.find('[data-test="bulk-link-split-hint"]').exists()).toBe(true);
  });

  it('shows the summary once products are picked', async () => {
    const pane = await mountPane('images');
    expect(pane.find('[data-test="bulk-link-summary"]').text()).toBe('summary');
  });
});
