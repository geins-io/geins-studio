import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../test/helpers';
import { ContentTitleBlock } from '#components';

describe('ContentTitleBlock', () => {
  it('can mount the component', async () => {
    const component = await mountWithContext(ContentTitleBlock, {
      props: {
        title: 'Title',
      },
    });
    expect(component.html()).toMatch('content-title-block');
  });
});
