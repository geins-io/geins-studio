import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildChannelListItem } from '../../../../../test/fixtures/channel';
import { mountWithContext } from '../../../../../test/helpers/mount';

const mockChannels = [buildChannelListItem()];

vi.mock('#app/stores/account', () => ({
  useAccountStore: () => ({
    channels: mockChannels,
    refreshChannels: vi.fn(),
  }),
}));

describe('settings/channel/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
