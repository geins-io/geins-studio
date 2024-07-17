import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { AuthForm } from '#components';

describe('AuthForm', () => {
  it('Can mount the component', async () => {
    const component = await mountSuspended(AuthForm, {
      props: {
        pending: false,
        showInvalid: false,
        mode: 'login',
      },
    });
    expect(component.html()).toMatch('auth-form');
  });

  //   it('Allows the user to enter email', async () => {
  //     const component = await mountSuspended(AuthForm, {
  //       props: {
  //         pending: false,
  //         showInvalid: false,
  //         mode: 'login',
  //       },
  //     });
  //     const input = component.findComponent({ id: 'email' });
  //     await input.setValue('email', 'user@geins.io');
  //     expect(input.props('modelValue')).toBe('user@geins.io');
  //   });
});
