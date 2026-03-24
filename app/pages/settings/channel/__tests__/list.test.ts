import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildChannelListItem } from '../../../../../test/fixtures/channel';
import { mountWithContext } from '../../../../../test/helpers/mount';

const channelApi = {
  channel: {
    list: vi.fn(),
  },
};

vi.mock('#app/composables/useGeinsRepository', () => ({
  useGeinsRepository: () => ({ channelApi }),
}));

describe('settings/channel/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    channelApi.channel.list.mockResolvedValue([buildChannelListItem()]);
  });

  it('renders without crashing', async () => {
    const ListPage = await import('../list.vue').then((m) => m.default);
    const wrapper = await mountWithContext(ListPage, {
      global: {
        stubs: {
          ContentHeader: true,
          ContentActionBar: true,
          ButtonIcon: true,
          TableView: true,
          NuxtErrorBoundary: true,
        },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
