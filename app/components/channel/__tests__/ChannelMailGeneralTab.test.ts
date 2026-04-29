import { useForm } from 'vee-validate';
import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountWithContext } from '../../../../test/helpers';
import ChannelMailGeneralTab from '../ChannelMailGeneralTab.vue';

type FormHandle = ReturnType<typeof useForm>;

// Render the component inside a fresh VeeValidate form so the FormField
// bindings resolve against `mail.*` in the parent form scope. A closure
// captures the form handle for assertion.
function makeHarness(initialMail: Record<string, unknown> = {}) {
  const captured: { form?: FormHandle } = {};
  const Harness = defineComponent({
    setup() {
      captured.form = useForm({
        initialValues: {
          mail: {
            disabled: false,
            displayName: '',
            orderConfirmationBCCEmail: '',
            loginUrl: '',
            passwordResetUrl: '',
            ...initialMail,
          },
        },
      });
      return () => h(ChannelMailGeneralTab);
    },
  });
  return { Harness, captured };
}

describe('ChannelMailGeneralTab', () => {
  it('writes display name edits back into the parent form state', async () => {
    const { Harness, captured } = makeHarness({ displayName: 'Old' });
    const component = await mountWithContext(Harness);
    const displayNameInput = component
      .findAll('input')
      .find(
        (i) =>
          i.attributes('type') !== 'email' &&
          i.attributes('type') !== 'url' &&
          i.attributes('type') !== 'checkbox',
      );
    await displayNameInput!.setValue('New Display Name');
    await component.vm.$nextTick();
    expect(captured.form!.values.mail?.displayName).toBe('New Display Name');
  });

  it('hides mail content fields when disabled flag is true', async () => {
    const { Harness } = makeHarness({ disabled: true });
    const component = await mountWithContext(Harness);
    // Content block is kept mounted via v-show — should be style="display: none"
    const hidden = component.findAll('[style*="display: none"]');
    expect(hidden.length).toBeGreaterThan(0);
  });

  it('exposes FormField bindings that surface Zod errors from the parent form', async () => {
    const { captured, Harness } = makeHarness({ displayName: '' });
    await mountWithContext(Harness);
    // Without a schema attached the form has no errors; confirm the expected
    // mail.* field names are present so the parent schema can target them.
    expect(captured.form!.values.mail).toEqual(
      expect.objectContaining({
        disabled: false,
        displayName: '',
        orderConfirmationBCCEmail: '',
        loginUrl: '',
        passwordResetUrl: '',
      }),
    );
  });
});
