import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { LayoutHeader } from '#components';

describe('LayoutHeader', () => {
  // TODO: Fix in Phase 3 (STU-29) — requires SidebarContext provider wrapper
  it.skip('can mount the component', async () => {
    const component = await mountSuspended(LayoutHeader);
    expect(component.html()).toMatch('layout-header');
  });
});
