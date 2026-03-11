import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { defineComponent, computed, ref, h } from 'vue';
import { provideSidebarContext } from '@/components/ui/sidebar/utils';
import { LayoutHeader } from '#components';

// Wrapper that provides the required SidebarContext
const SidebarProviderStub = defineComponent({
  setup(_props, { slots }) {
    provideSidebarContext({
      state: computed(() => 'expanded' as const),
      open: ref(true),
      setOpen: () => {},
      isMobile: ref(false),
      openMobile: ref(false),
      setOpenMobile: () => {},
      toggleSidebar: () => {},
    });
    return () => h('div', slots.default?.());
  },
});

describe('LayoutHeader', () => {
  it('can mount the component', async () => {
    const wrapper = defineComponent({
      components: { SidebarProviderStub, LayoutHeader },
      template: '<SidebarProviderStub><LayoutHeader /></SidebarProviderStub>',
    });
    const component = await mountSuspended(wrapper);
    expect(component.find('header').exists()).toBe(true);
  });
});
