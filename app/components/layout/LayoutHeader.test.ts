import { describe, it, expect } from 'vitest';
import { mountWithSidebar } from '../../../test/helpers';
import { LayoutHeader } from '#components';

describe('LayoutHeader', () => {
  it('can mount the component', async () => {
    const component = await mountWithSidebar(LayoutHeader);
    expect(component.find('header').exists()).toBe(true);
  });
});
