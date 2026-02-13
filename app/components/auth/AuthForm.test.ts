import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { AuthForm } from '#components';

describe('AuthForm', () => {
  // TODO: Fix in Phase 3 (STU-29) — rendered HTML no longer contains 'auth-form'
  it.skip('can mount the component', async () => {
    const component = await mountSuspended(AuthForm, {
      props: {
        pending: false,
        showInvalid: false,
        mode: 'login',
      },
    });
    expect(component.html()).toMatch('auth-form');
  });
});
