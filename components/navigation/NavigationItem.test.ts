import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { NavigationItem } from '#components';

describe('NavigationItem', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(NavigationItem, {
      props: {
        item: {
          label: 'Label',
          href: '',
        },
      },
    });
    expect(component.html()).toMatch('navigation-item');
  });
});
