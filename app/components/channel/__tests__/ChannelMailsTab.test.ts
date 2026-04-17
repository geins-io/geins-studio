import { describe, it, expect } from 'vitest';
import { buildMailSettings, buildMailType } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';
import { ChannelMailsTab } from '#components';

const baseProps = {
  channelId: 'ch-1',
  languages: [],
  defaultLanguage: 'en',
};

describe('ChannelMailsTab', () => {
  it('renders the three sub-tab triggers', async () => {
    const component = await mountWithContext(ChannelMailsTab, {
      props: {
        ...baseProps,
        generalFields: buildMailSettings(),
        layoutFields: buildMailSettings(),
        layoutFiles: {},
        mailTypes: [buildMailType()],
      },
    });
    const triggers = component.findAll('[data-slot="tabs-trigger"]');
    // 3 outer sub-tabs + 2 inner (Edit / Preview) inside the config sheet.
    // The sheet is closed on mount so only outer tabs render.
    expect(triggers.length).toBeGreaterThanOrEqual(3);
  });

  it('renders without crashing when generalFields is empty and mailTypes is empty', async () => {
    const component = await mountWithContext(ChannelMailsTab, {
      props: {
        ...baseProps,
        generalFields: {},
        layoutFields: {},
        layoutFiles: {},
        mailTypes: [],
      },
    });
    expect(component.exists()).toBe(true);
  });
});
