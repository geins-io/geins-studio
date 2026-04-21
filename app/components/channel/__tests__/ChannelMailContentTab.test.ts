import { describe, it, expect } from 'vitest';
import { buildMailType } from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';
import ChannelMailContentRow from '../ChannelMailContentRow.vue';
import ChannelMailContentTab from '../ChannelMailContentTab.vue';

describe('ChannelMailContentTab', () => {
  it('renders one row per mail type in a flat list', async () => {
    const mailTypes = [
      buildMailType({ _id: 'orderConfirmation', category: 'Order' }),
      buildMailType({
        _id: 'customerRegistered',
        name: 'Customer Registered',
        category: 'Customer',
      }),
      buildMailType({
        _id: 'productTellAFriend',
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
    const buttons = component.findComponent(ChannelMailContentRow).findAll('button');
    await buttons[buttons.length - 1]!.trigger('click');
    expect(component.emitted('edit')).toBeTruthy();
    expect(component.emitted('edit')![0]).toEqual([mailType]);
  });

  it('renders the empty state when mailTypes is empty', async () => {
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes: [] },
    });
    expect(component.text()).toContain('channels.no_mail_types');
  });

  it('applies reduced opacity when loading', async () => {
    const mailTypes = [buildMailType()];
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes, loading: true },
    });
    expect(component.find('div').classes()).toContain('opacity-50');
  });

  it('shows the overridden indicator when hasOverrides is true', async () => {
    const component = await mountWithContext(ChannelMailContentTab, {
      props: { mailTypes: [buildMailType({ hasOverrides: true })] },
    });
    expect(component.text()).toContain('channels.mail_text_overridden');
  });
});
