import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { ContentActionBar } from '#components';

describe('ContentActionBar', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(ContentActionBar);
    expect(component.html()).toMatch('content-action-bar');
  });
});
