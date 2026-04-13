import { describe, it, expect } from 'vitest';
import { buildMailSettings, buildMailType } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';
import { ChannelMailsTab } from '#components';

describe('ChannelMailsTab', () => {
  it('renders the three sub-tab triggers', async () => {
    const component = await mountWithContext(ChannelMailsTab, {
      props: {
        generalFields: buildMailSettings(),
        mailTypes: [buildMailType()],
      },
    });
    const triggers = component.findAll('[data-slot="tabs-trigger"]');
    expect(triggers).toHaveLength(3);
  });

  it('renders without crashing when generalFields is empty and mailTypes is empty', async () => {
    const component = await mountWithContext(ChannelMailsTab, {
      props: {
        generalFields: {},
        mailTypes: [],
      },
    });
    expect(component.exists()).toBe(true);
    expect(component.findAll('[data-slot="tabs-trigger"]')).toHaveLength(3);
  });
});
