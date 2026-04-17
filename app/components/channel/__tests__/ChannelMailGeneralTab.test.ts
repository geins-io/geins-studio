import { describe, it, expect } from 'vitest';
import { buildMailSettings } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';
import ChannelMailGeneralTab from '../ChannelMailGeneralTab.vue';

describe('ChannelMailGeneralTab', () => {
  it('emits updated partial settings when display name changes', async () => {
    const component = await mountWithContext(ChannelMailGeneralTab, {
      props: {
        modelValue: buildMailSettings({ displayName: 'Old' }),
      } as Record<string, unknown>,
    });
    const inputs = component.findAll('input');
    const displayNameInput = inputs.find(
      (i) => i.attributes('type') !== 'email'
        && i.attributes('type') !== 'url'
        && i.attributes('type') !== 'checkbox',
    );
    await displayNameInput!.setValue('New Display Name');
    const emitted = component.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const last = emitted![emitted!.length - 1]![0] as Record<string, unknown>;
    expect(last.displayName).toBe('New Display Name');
  });

  it('collapses the Advanced section by default', async () => {
    const component = await mountWithContext(ChannelMailGeneralTab, {
      props: { modelValue: buildMailSettings() } as Record<string, unknown>,
    });
    const switches = component.findAll('[data-slot="switch"]');
    expect(switches[1]!.attributes('data-state')).toBe('unchecked');
  });

  it('expands the Advanced section when the switch is toggled on', async () => {
    const component = await mountWithContext(ChannelMailGeneralTab, {
      props: { modelValue: buildMailSettings() } as Record<string, unknown>,
    });
    const switches = component.findAll('[data-slot="switch"]');
    await switches[1]!.trigger('click');
    await component.vm.$nextTick();
    expect(switches[1]!.attributes('data-state')).toBe('checked');
    const labels = component.findAll('label').map((l) => l.text());
    expect(labels).toContain('channels.mail_login_slug');
  });
});
