import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { AuthForm } from '#components';

describe('AuthForm', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(AuthForm, {
      props: {
        pending: false,
        showInvalid: false,
        mode: 'login',
      },
    });
    expect(component.find('form').exists()).toBe(true);
  });
});
