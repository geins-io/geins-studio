// @vitest-environment node
// eslint-disable-next-line import/order
import { describe, it, expect, vi, beforeEach } from 'vitest';
const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
}));

vi.mock('#app/composables/router', () => ({
  navigateTo: mockNavigateTo,
}));

// eslint-disable-next-line import/first
import { useDeleteDialog } from '../useDeleteDialog';

describe('useDeleteDialog', () => {
  beforeEach(() => {
    mockNavigateTo.mockClear();
  });

  it('starts with dialog closed and not deleting', () => {
    const { deleteDialogOpen, deleting } = useDeleteDialog(vi.fn());
    expect(deleteDialogOpen.value).toBe(false);
    expect(deleting.value).toBe(false);
  });

  it('opens the dialog via openDeleteDialog', async () => {
    const { deleteDialogOpen, openDeleteDialog } = useDeleteDialog(vi.fn());
    await openDeleteDialog();
    expect(deleteDialogOpen.value).toBe(true);
  });

  it('sets deleting to true during delete operation', async () => {
    let resolveDelete!: (value: boolean) => void;
    const deleteAction = () =>
      new Promise<boolean>((r) => {
        resolveDelete = r;
      });
    const { deleting, confirmDelete } = useDeleteDialog(deleteAction);

    const deletePromise = confirmDelete();
    expect(deleting.value).toBe(true);

    resolveDelete(true);
    await deletePromise;
    expect(deleting.value).toBe(false);
  });

  it('navigates on successful delete with redirect URL', async () => {
    const deleteAction = vi.fn().mockResolvedValue(true);
    const { confirmDelete } = useDeleteDialog(deleteAction, '/redirect');

    await confirmDelete();
    expect(mockNavigateTo).toHaveBeenCalledWith('/redirect');
  });

  it('does not navigate on failed delete', async () => {
    const deleteAction = vi.fn().mockResolvedValue(false);
    const { confirmDelete } = useDeleteDialog(deleteAction, '/redirect');

    await confirmDelete();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('does not navigate when no redirect URL is provided', async () => {
    const deleteAction = vi.fn().mockResolvedValue(true);
    const { confirmDelete } = useDeleteDialog(deleteAction);

    await confirmDelete();
    expect(mockNavigateTo).not.toHaveBeenCalled();
  });

  it('closes dialog after confirmDelete completes', async () => {
    const deleteAction = vi.fn().mockResolvedValue(true);
    const { deleteDialogOpen, openDeleteDialog, confirmDelete } =
      useDeleteDialog(deleteAction);

    await openDeleteDialog();
    expect(deleteDialogOpen.value).toBe(true);

    await confirmDelete();
    expect(deleteDialogOpen.value).toBe(false);
  });

  it('calls the deleteAction exactly once on confirmDelete', async () => {
    const deleteAction = vi.fn().mockResolvedValue(true);
    const { confirmDelete } = useDeleteDialog(deleteAction, '/redirect');

    await confirmDelete();
    expect(deleteAction).toHaveBeenCalledOnce();
  });
});
