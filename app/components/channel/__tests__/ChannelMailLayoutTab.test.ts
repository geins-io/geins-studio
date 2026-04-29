import { describe, it, expect, beforeAll, vi } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import ChannelMailLayoutTab from '../ChannelMailLayoutTab.vue';

beforeAll(() => {
  // jsdom lacks URL.createObjectURL — FormInputImage calls it on file select.
  if (!('createObjectURL' in URL)) {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock'),
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      writable: true,
    });
  }
});

describe('ChannelMailLayoutTab', () => {
  it('renders section headers for all five groups', async () => {
    const component = await mountWithContext(ChannelMailLayoutTab, {
      props: { modelValue: {} } as Record<string, unknown>,
    });
    const text = component.text();
    expect(text).toContain('channels.mail_images');
    expect(text).toContain('channels.mail_colors');
    expect(text).toContain('channels.mail_typography');
    expect(text).toContain('channels.mail_shape');
    expect(text).toContain('channels.mail_product_display');
  });

  it('emits update:modelValue when a color input changes', async () => {
    const component = await mountWithContext(ChannelMailLayoutTab, {
      props: {
        modelValue: { backgroundColor: '#ffffff' },
      } as Record<string, unknown>,
    });
    const textInputs = component.findAll('input[type="text"], input:not([type])');
    const bgTextInput = textInputs.find(
      (i) => (i.element as HTMLInputElement).value === '#ffffff',
    );
    await bgTextInput!.setValue('#000000');
    const emitted = component.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const last = emitted![emitted!.length - 1]![0] as Record<string, unknown>;
    expect(last.backgroundColor).toBe('#000000');
  });

  it('emits update:stagedFiles without touching modelValue.logoUrl', async () => {
    const component = await mountWithContext(ChannelMailLayoutTab, {
      props: {
        modelValue: { logoUrl: 'https://cdn/logo.png' },
      } as Record<string, unknown>,
    });
    const file = new File(['logo'], 'new.png', { type: 'image/png' });
    // Use the FormInputImage component's event rather than driving the native
    // file input (which jsdom doesn't fully support).
    const imageInputs = component.findAllComponents({ name: 'FormInputImage' });
    imageInputs[0]!.vm.$emit('update:modelValue', file);
    await component.vm.$nextTick();

    const staged = component.emitted('update:stagedFiles');
    expect(staged).toBeTruthy();
    const last = staged![staged!.length - 1]![0] as {
      logoUrl?: File;
      headerImgUrl?: File;
    };
    expect(last.logoUrl).toBeInstanceOf(File);
    // modelValue.logoUrl must NOT have been emitted — only the staged-files model.
    expect(component.emitted('update:modelValue')).toBeUndefined();
  });
});
