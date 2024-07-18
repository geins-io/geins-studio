import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { LayoutSidebar } from '#components';

describe('LayoutSidebar', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(LayoutSidebar);
    expect(component.html()).toMatch('layout-sidebar');
  });
});
