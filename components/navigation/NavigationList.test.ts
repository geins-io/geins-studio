import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { NavigationList } from '#components';

describe('NavigationList', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(NavigationList);
    expect(component.html()).toMatch('navigation-list');
  });
});
