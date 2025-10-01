export function useDeleteDialog(
  deleteAction: () => Promise<boolean>,
  successRedirectUrl?: string,
) {
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
