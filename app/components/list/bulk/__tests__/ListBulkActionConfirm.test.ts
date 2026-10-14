import { describe, it, expect } from 'vitest';
import type { BulkAction } from '#shared/types';
import { mountWithContext } from '../../../../../test/helpers';
import { ListBulkActionConfirm } from '#components';

// The dialog's portal teleports to document.body; render it inline so the
// wrapper can reach it. Stubbing the content instead breaks AlertDialogCancel.
const stubs = { AlertDialogPortal: { template: '<div><slot /></div>' } };

const base = {
  key: 'add-tags',
  label: 'Add tags',
  icon: 'Tag',
  run: () => Promise.resolve(),
  successMessage: () => 'done',
} satisfies BulkAction;

async function mount(action: BulkAction, value?: unknown, scopeNote?: string) {
  return await mountWithContext(ListBulkActionConfirm, {
    props: {
      open: true,
      action,
      value,
      ids: ['a1', 'a2', 'a3'],
      entityKey: 'asset',
      scopeNote,
    },
    global: { stubs },
  });
}

describe('ListBulkActionConfirm', () => {
  it("asks the action's question and says its label on the button", async () => {
    const wrapper = await mount(
      {
        ...base,
        confirmTitle: (count, value) =>
          `Add ${(value as string[]).length} tags to ${count} assets?`,
      },
      ['sale', 'hero'],
    );
    expect(wrapper.text()).toContain('Add 2 tags to 3 assets?');
    expect(wrapper.find('[data-test="bulk-confirm"]').text()).toBe('Add tags');
  });

  it('shows tag values as pills, capped with a "more" count', async () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag-${i}`);
    const wrapper = await mount(
      { ...base, confirmTitle: () => 'Add?', summary: () => ({ tags }) },
      tags,
    );
    const row = wrapper.find('[data-test="bulk-confirm-tags"]');
    expect(row.text()).toContain('tag-7');
    expect(row.text()).not.toContain('tag-8');
    expect(row.text()).toContain('more_count');
  });

  it('shows a path with the warning instead of a muted note', async () => {
    const wrapper = await mount({
      ...base,
      confirmTitle: () => 'Move?',
      summary: () => ({ path: ['Campaigns', '2026'], icon: 'Folder' }),
      warning: () => ({ title: 'Links change', description: 'URLs move.' }),
    });
    expect(wrapper.find('[data-test="bulk-confirm-path"]').text()).toMatch(
      /Campaigns\s*2026/,
    );
    expect(wrapper.find('[data-test="bulk-confirm-warning"]').text()).toContain(
      'Links change',
    );
    expect(wrapper.find('[data-test="bulk-confirm-note"]').exists()).toBe(
      false,
    );
  });

  it('shows a list summary as one bullet per item, and the note', async () => {
    const wrapper = await mount({
      ...base,
      confirmTitle: () => 'Link?',
      summary: () => ({
        list: ['3 assets → 1 product (3 links)', 'All as file'],
      }),
      note: () => 'Existing links are kept.',
    });
    const items = wrapper.findAll('[data-test="bulk-confirm-list"] li');
    expect(items.map((item) => item.text())).toEqual([
      '3 assets → 1 product (3 links)',
      'All as file',
    ]);
    expect(wrapper.find('[data-test="bulk-confirm-note"]').text()).toBe(
      'Existing links are kept.',
    );
  });

  it('falls back to the generic title and keeps the scope note', async () => {
    const wrapper = await mount(base, undefined, 'Includes subfolders.');
    expect(wrapper.text()).toContain('Includes subfolders.');
    expect(wrapper.find('[data-test="bulk-confirm-tags"]').exists()).toBe(
      false,
    );
    expect(wrapper.find('[data-test="bulk-confirm"]').text()).toBe('Add tags');
  });
});
