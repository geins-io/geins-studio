import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountWithContext } from '../../../test/helpers';
import {
  providePendingCommits,
  registerPendingCommit,
  type PendingEdit,
  type UsePendingCommitsReturnType,
} from '../usePendingCommits';

/** A control that registers `edit` with whatever host is above it. */
function control(edit: PendingEdit) {
  return defineComponent({
    setup() {
      registerPendingCommit(edit);
      return () => h('div');
    },
  });
}

/** Mount a host around `children`, handing the registry back to the test. */
async function mountHost(children: ReturnType<typeof control>[]) {
  let registry!: UsePendingCommitsReturnType;
  const show = ref(true);
  const host = defineComponent({
    setup() {
      registry = providePendingCommits();
      return () => (show.value ? children.map((c) => h(c)) : []);
    },
  });
  const wrapper = await mountWithContext(host);
  return { registry, show, wrapper };
}

const edit = (
  pending: boolean,
  commit: () => Promise<boolean> = () => Promise.resolve(true),
): PendingEdit => ({ pending: () => pending, commit });

describe('usePendingCommits', () => {
  it('has nothing pending and commits cleanly with no controls', async () => {
    const { registry } = await mountHost([]);
    expect(registry.hasPending.value).toBe(false);
    await expect(registry.commitPending()).resolves.toBe(true);
  });

  it('reports a control holding an unconfirmed edit', async () => {
    const { registry } = await mountHost([control(edit(true))]);
    expect(registry.hasPending.value).toBe(true);
  });

  it('commits only the controls that are pending', async () => {
    const idle = vi.fn(() => Promise.resolve(true));
    const open = vi.fn(() => Promise.resolve(true));
    const { registry } = await mountHost([
      control(edit(false, idle)),
      control(edit(true, open)),
    ]);

    await expect(registry.commitPending()).resolves.toBe(true);
    expect(idle).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledOnce();
  });

  it('stops at the first failed commit', async () => {
    const fails = vi.fn(() => Promise.resolve(false));
    const later = vi.fn(() => Promise.resolve(true));
    const { registry } = await mountHost([
      control(edit(true, fails)),
      control(edit(true, later)),
    ]);

    await expect(registry.commitPending()).resolves.toBe(false);
    expect(fails).toHaveBeenCalledOnce();
    expect(later).not.toHaveBeenCalled();
  });

  it('forgets a control once it unmounts', async () => {
    const commit = vi.fn(() => Promise.resolve(true));
    const { registry, show, wrapper } = await mountHost([
      control(edit(true, commit)),
    ]);
    expect(registry.hasPending.value).toBe(true);

    show.value = false;
    await wrapper.vm.$nextTick();

    expect(registry.hasPending.value).toBe(false);
    await registry.commitPending();
    expect(commit).not.toHaveBeenCalled();
  });

  it('leaves a control without a host working', async () => {
    const standalone = await mountWithContext(control(edit(true)));
    expect(standalone.html()).toBe('<div></div>');
  });
});
