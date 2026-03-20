import { mountSuspended } from '@nuxt/test-utils/runtime';
import { computed, defineComponent, h, ref } from 'vue';
import { provideSidebarContext } from '@/components/ui/sidebar/utils';
import type { ComponentMountingOptions } from '@vue/test-utils';

type MountContextOptions = Pick<
  ComponentMountingOptions<unknown>,
  'props' | 'slots' | 'global'
>;

export async function mountWithContext(
  component: unknown,
  options?: MountContextOptions,
) {
  return mountSuspended(component as Parameters<typeof mountSuspended>[0], {
    props: options?.props,
    slots: options?.slots,
    global: {
      plugins: [...(options?.global?.plugins ?? [])],
      provide: {
        ...options?.global?.provide,
      },
      stubs: {
        ...options?.global?.stubs,
      },
    },
  });
}

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

export async function mountWithSidebar(
  component: unknown,
  options?: MountContextOptions,
) {
  const wrapper = defineComponent({
    components: { SidebarProviderStub },
    setup() {
      return () =>
        h(SidebarProviderStub, null, {
          default: () =>
            h(
              component as Parameters<typeof h>[0],
              options?.props,
              options?.slots,
            ),
        });
    },
  });

  return mountSuspended(wrapper, {
    global: {
      plugins: [...(options?.global?.plugins ?? [])],
      provide: {
        ...options?.global?.provide,
      },
      stubs: {
        ...options?.global?.stubs,
      },
    },
  });
}
