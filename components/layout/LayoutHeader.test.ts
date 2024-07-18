import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { LayoutHeader } from '#components';

describe('LayoutHeader', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(LayoutHeader);
    expect(component.html()).toMatch('layout-header');
  });
});
