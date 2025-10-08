interface UseDeleteDialogReturnType {
  deleteDialogOpen: Ref<boolean>;
  deleting: Ref<boolean>;
  openDeleteDialog: () => Promise<void>;
  confirmDelete: () => Promise<void>;
}

/**
 * Composable for managing delete confirmation dialogs with loading states.
 *
 * Provides a standardized way to handle delete operations with user confirmation,
 * including loading states and optional navigation after successful deletion.
 *
 * @param deleteAction - Function that performs the actual delete operation
 * @param successRedirectUrl - Optional URL to navigate to after successful deletion
 * @returns {UseDeleteDialogReturnType} - An object containing delete dialog state and actions
 * @property {Ref<boolean>} deleteDialogOpen - Whether the delete confirmation dialog is open
 * @property {Ref<boolean>} deleting - Whether a delete operation is in progress
 * @property {function} openDeleteDialog - Opens the delete confirmation dialog
 * @property {function} confirmDelete - Executes the delete action and handles navigation
 */
export function useDeleteDialog(
  deleteAction: () => Promise<boolean>,
  successRedirectUrl?: string,
): UseDeleteDialogReturnType {
  const deleteDialogOpen = ref(false);
  const deleting = ref(false);

  const openDeleteDialog = async () => {
    await nextTick();
    deleteDialogOpen.value = true;
  };

  const confirmDelete = async () => {
    deleting.value = true;
    const success = await deleteAction();
    if (success && successRedirectUrl) {
      navigateTo(successRedirectUrl);
    }
    deleting.value = false;
    deleteDialogOpen.value = false;
  };

  return {
    deleteDialogOpen,
    deleting,
    openDeleteDialog,
    confirmDelete,
  };
}
