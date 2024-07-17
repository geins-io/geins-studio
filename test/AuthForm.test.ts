import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { AuthForm } from '#components';

describe('AuthForm Component', () => {
  // it('should pass', () => {
  //   expect(true).toBe(true);
  // });

  it('can mount the component', async () => {
    const component = await mountSuspended(AuthForm);
    expect(component.text()).toMatch('Merchant Center');
  });

  // it('renders the AuthForm component', async () => {
  //   const component = await mountSuspended(AuthForm);
  //   expect(component.html()).toContain('Merchant Center');
  // });

  //   it('allows the user to enter username', async () => {
  //     const wrapper = await mountSuspended(AuthForm);
  //     const usernameInput = wrapper.find('input[name="username"]');
  //     await usernameInput.setValue('username123');
  //     expect((usernameInput.element as HTMLInputElement).value).toBe(
  //       'username123',
  //     );
  //   });

  //   it('allows the user to enter password', async () => {
  //     const wrapper = await mountSuspended(AuthForm);
  //     const passwordInput = wrapper.find('input[name="password"]');
  //     await passwordInput.setValue('password123');
  //     expect((passwordInput.element as HTMLInputElement).value).toBe(
  //       'password123',
  //     );
  //   });

  //   it('submits the form with username and password', async () => {
  //     const wrapper = await mountSuspended(AuthForm);
  //     const usernameInput = wrapper.find('input[name="username"]');
  //     const passwordInput = wrapper.find('input[name="password"]');
  //     const form = wrapper.find('form');

  //     await usernameInput.setValue('username123');
  //     await passwordInput.setValue('password123');
  //     await form.trigger('submit');

  //     expect(wrapper.emitted('submit')).toBeTruthy();
  //     expect(wrapper.emitted('submit')?.[0]).toEqual([
  //       { username: 'username123', password: 'password123' },
  //     ]);
  //   });
});
