import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { ContentTitleBlock } from '#components';

describe('ContentTitleBlock', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(ContentTitleBlock, {
      props: {
        title: 'Title',
      },
    });
    expect(component.html()).toMatch('content-title-block');
  });
});
