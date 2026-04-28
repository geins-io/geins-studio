import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { ChannelStorefrontSettings } from '#components';

const baseProps = {
  schema: {},
  modelValue: {},
};

function findPreviewButton(
  component: Awaited<ReturnType<typeof mountWithContext>>,
) {
  // i18n key is returned as-is in test env; button text includes the key
  return component
    .findAll('[data-slot="button"]')
    .find((b) => b.text().includes('channels.preview_storefront'));
}

describe('ChannelStorefrontSettings', () => {
  it('emits preview when preview button is clicked', async () => {
    const component = await mountWithContext(ChannelStorefrontSettings, {
      props: baseProps,
    });
    const previewBtn = findPreviewButton(component);
    expect(previewBtn).toBeDefined();
    await previewBtn!.trigger('click');
    expect(component.emitted('preview')).toBeTruthy();
    expect(component.emitted('preview')).toHaveLength(1);
  });

  it('shows loading state when previewing prop is true', async () => {
    const component = await mountWithContext(ChannelStorefrontSettings, {
      props: { ...baseProps, previewing: true },
    });
    const previewBtn = findPreviewButton(component);
    expect(previewBtn).toBeDefined();
    expect(previewBtn!.find('.animate-spin').exists()).toBe(true);
  });

  it('disables preview button when disabled prop is true', async () => {
    const component = await mountWithContext(ChannelStorefrontSettings, {
      props: { ...baseProps, disabled: true },
    });
    const previewBtn = findPreviewButton(component);
    expect(previewBtn).toBeDefined();
    expect(previewBtn!.attributes('disabled')).toBeDefined();
  });
});
