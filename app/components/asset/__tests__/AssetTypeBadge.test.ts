import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetTypeBadge } from '#components';

describe('AssetTypeBadge', () => {
  it('renders the type label', async () => {
    const badge = await mountWithContext(AssetTypeBadge, {
      props: { type: 'image' },
    });
    // With empty test messages, t() echoes the label key.
    expect(badge.text()).toBe('asset_type.image');
  });

  it('renders a badge element', async () => {
    const badge = await mountWithContext(AssetTypeBadge, {
      props: { type: 'pdf' },
    });
    expect(badge.find('[data-slot="badge"]').exists()).toBe(true);
  });
});
