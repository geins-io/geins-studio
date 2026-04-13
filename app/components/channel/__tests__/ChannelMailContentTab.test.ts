import { describe, it, expect } from 'vitest';
import { buildMailType } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';
import ChannelMailContentTab from '../ChannelMailContentTab.vue';
import ChannelMailContentRow from '../ChannelMailContentRow.vue';

describe('ChannelMailContentTab', () => {
  it('renders one row per mail type grouped by category', async () => {
    const mailTypes = [
      buildMailType({ type: 'OrderConfirmation', category: 'Order' }),
      buildMailType({
        type: 'CustomerRegistered',
        name: 'Customer Registered',
        category: 'Customer',
      }),
      buildMailType({
        type: 'ProductTellAFriend',
        name: 'Tell a Friend',
        category: 'Product',
      }),
    ];
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes },
    });
    const rows = component.findAllComponents(ChannelMailContentRow);
    expect(rows).toHaveLength(3);
  });

  it('emits edit with the clicked mail type', async () => {
    const mailType = buildMailType();
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes: [mailType] },
    });
    await component.findComponent(ChannelMailContentRow).find('button').trigger('click');
    expect(component.emitted('edit')).toBeTruthy();
    expect(component.emitted('edit')![0]).toEqual([mailType]);
  });

  it('renders the empty state when mailTypes is empty', async () => {
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes: [] },
    });
    expect(component.text()).toContain('channels.no_mail_types');
  });

  it('renders three skeleton rows when loading', async () => {
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes: [], loading: true },
    });
    expect(component.findAll('[data-slot="skeleton"]')).toHaveLength(3);
  });

  it('shows the overridden indicator when hasOverrides is true', async () => {
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes: [buildMailType({ hasOverrides: true })] },
    });
    expect(
      component.find('[title="channels.mail_overridden_indicator"]').exists(),
    ).toBe(true);
  });
});
