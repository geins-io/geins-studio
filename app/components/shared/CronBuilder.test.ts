import cronstrue from 'cronstrue';
import { Field, useForm } from 'vee-validate';
import { describe, it, expect } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import CronBuilder from '@/components/shared/CronBuilder.vue';
import { Select } from '@/components/ui/select';
import { mountWithContext } from '../../../test/helpers';

const flush = async () => {
  for (let i = 0; i < 6; i++) {
    await nextTick();
    await Promise.resolve();
  }
};

const lastCron = (wrapper: {
  emitted: (name: string) => unknown[] | undefined;
}) => {
  const events = wrapper.emitted('update:modelValue') as [string][] | undefined;
  return events?.at(-1)?.[0];
};

const isValidCron = (expr: unknown) => {
  if (typeof expr !== 'string') return false;
  try {
    cronstrue.toString(expr);
    return true;
  } catch {
    return false;
  }
};

describe('CronBuilder', () => {
  it('seeds the default preset when mounted without a value', async () => {
    const wrapper = await mountWithContext(CronBuilder, {
      props: { modelValue: '' },
    });
    await flush();
    expect(lastCron(wrapper)).toBe('0 * * * * *');
  });

  it('never emits an invalid cron when a Select emits undefined/empty', async () => {
    const wrapper = await mountWithContext(CronBuilder, {
      props: { modelValue: '' },
    });
    await flush();

    const hourly = wrapper
      .findAll('button')
      .find((b) => b.text().includes('every_hour'));
    await hourly!.trigger('click');
    await flush();

    const minute = wrapper.findComponent(Select);
    // A real selection.
    minute.vm.$emit('update:modelValue', '15');
    await flush();
    expect(lastCron(wrapper)).toBe('0 15 * * * *');

    // Reka can fire update:modelValue with undefined/empty on some change
    // interactions — these must not corrupt the cron into `0 NaN * * * *`.
    for (const payload of [undefined, null, '']) {
      minute.vm.$emit('update:modelValue', payload);
      await flush();
      expect(isValidCron(lastCron(wrapper))).toBe(true);
    }
    expect(lastCron(wrapper)).toBe('0 15 * * * *');
  });

  it('loads a customized preset (0 16 * * * *) as its preset tab, not custom', async () => {
    const wrapper = await mountWithContext(CronBuilder, {
      props: { modelValue: '0 16 * * * *' },
    });
    await flush();
    const classesOf = (key: string) =>
      wrapper
        .findAll('button')
        .find((b) => b.text().includes(key))
        ?.classes() ?? [];
    expect(classesOf('every_hour')).toContain('bg-primary');
    expect(classesOf('custom')).not.toContain('bg-primary');
  });

  it('keeps a range-based cron (0 0 9 * * 1-5) as custom', async () => {
    const wrapper = await mountWithContext(CronBuilder, {
      props: { modelValue: '0 0 9 * * 1-5' },
    });
    await flush();
    const custom = wrapper
      .findAll('button')
      .find((b) => b.text().includes('custom'));
    expect(custom?.classes()).toContain('bg-primary');
  });

  // Bound inside a vee-validate field within a <form>, reka's <Select> renders a
  // hidden BubbleSelect that fires a bubbling native `change` carrying the raw value.
  // If the field's native `onChange` falls through onto this component's root it
  // overwrites the cron with that raw value (e.g. "16"). `inheritAttrs: false` guards
  // against it. This reproduces the exact page wiring.
  it('does not leak the raw select value through a vee-validate field', async () => {
    let form: ReturnType<typeof useForm<{ trigger: { cron: string } }>>;
    const Wrapper = defineComponent({
      setup() {
        form = useForm<{ trigger: { cron: string } }>({
          initialValues: { trigger: { cron: '' } },
        });
        return () =>
          h('form', null, [
            h(
              Field,
              { name: 'trigger.cron' },
              {
                default: (slotProps: {
                  componentField: Record<string, unknown>;
                }) => h(CronBuilder, slotProps.componentField),
              },
            ),
          ]);
      },
    });

    const wrapper = await mountWithContext(Wrapper);
    await flush();
    const hourly = wrapper
      .findAll('button')
      .find((b) => b.text().includes('every_hour'));
    await hourly!.trigger('click');
    await flush();
    wrapper.findComponent(Select).vm.$emit('update:modelValue', '16');
    await flush();

    expect(form!.values.trigger?.cron).toBe('0 16 * * * *');
  });
});
