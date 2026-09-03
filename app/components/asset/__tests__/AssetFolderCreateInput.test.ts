import { describe, it, expect } from 'vitest';
import { mountWithContext } from '../../../../test/helpers';
import { AssetFolderCreateInput } from '#components';

describe('AssetFolderCreateInput', () => {
  it('emits create once when Enter is followed by the unmount blur', async () => {
    const input = await mountWithContext(AssetFolderCreateInput);
    const field = input.find('input');
    await field.setValue('Campaigns');
    await field.trigger('keydown.enter');
    // Committing hides the input → blur; must NOT create a second folder.
    await field.trigger('blur');

    expect(input.emitted('create')).toHaveLength(1);
    expect(input.emitted('create')?.[0]).toEqual(['Campaigns']);
  });

  it('commits a folder on blur (click away)', async () => {
    const input = await mountWithContext(AssetFolderCreateInput);
    const field = input.find('input');
    await field.setValue('Brand');
    await field.trigger('blur');
    expect(input.emitted('create')).toHaveLength(1);
  });

  it('cancels (no create) on an empty commit', async () => {
    const input = await mountWithContext(AssetFolderCreateInput);
    await input.find('input').trigger('keydown.enter');
    expect(input.emitted('create')).toBeUndefined();
    expect(input.emitted('cancel')).toHaveLength(1);
  });

  it('cancels once on Esc, ignoring the follow-up blur', async () => {
    const input = await mountWithContext(AssetFolderCreateInput);
    const field = input.find('input');
    await field.setValue('Ignored');
    await field.trigger('keydown.esc');
    await field.trigger('blur');
    expect(input.emitted('create')).toBeUndefined();
    expect(input.emitted('cancel')).toHaveLength(1);
  });
});
