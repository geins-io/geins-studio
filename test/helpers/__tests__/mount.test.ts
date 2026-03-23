import { describe, it, expect } from 'vitest';
import { defineComponent, h, inject } from 'vue';
import { mountWithContext, mountWithSidebar } from '../mount';

const TestComponent = defineComponent({
  props: {
    label: { type: String, default: 'default' },
  },
  setup(props) {
    return () => h('div', { class: 'test-component' }, props.label);
  },
});

const TEST_INJECT_KEY = 'test-inject-key';

const InjectConsumer = defineComponent({
  setup() {
    const value = inject(TEST_INJECT_KEY, 'missing');
    return () => h('span', { class: 'injected' }, String(value));
  },
});

describe('mountWithContext', () => {
  it('can mount a minimal test component', async () => {
    const wrapper = await mountWithContext(TestComponent);
    expect(wrapper.find('.test-component').exists()).toBe(true);
    expect(wrapper.text()).toBe('default');
  });

  it('passes custom props through correctly', async () => {
    const wrapper = await mountWithContext(TestComponent, {
      props: { label: 'custom' },
    });
    expect(wrapper.text()).toBe('custom');
  });

  it('passes custom provide values through correctly', async () => {
    const wrapper = await mountWithContext(InjectConsumer, {
      global: {
        provide: { [TEST_INJECT_KEY]: 'injected-value' },
      },
    });
    expect(wrapper.text()).toBe('injected-value');
  });

  it('applies default providers when no overrides are given', async () => {
    const wrapper = await mountWithContext(InjectConsumer);
    expect(wrapper.text()).toBe('missing');
  });
});

describe('mountWithSidebar', () => {
  it('can mount a component with sidebar context', async () => {
    const wrapper = await mountWithSidebar(TestComponent, {
      props: { label: 'sidebar-test' },
    });
    expect(wrapper.text()).toContain('sidebar-test');
  });
});
