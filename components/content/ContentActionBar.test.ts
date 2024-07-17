import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { ContentActionBar } from '#components';

describe('ContentActionBar', () => {
  it('Can mount the component', async () => {
    const component = await mountSuspended(ContentActionBar);
    expect(component.html()).toMatch('content-action-bar');
  });
});
