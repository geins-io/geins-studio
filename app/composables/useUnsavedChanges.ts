export function useUnsavedChanges<T>(
  currentData: Ref<T>,
  originalData: Ref<string>,
  createMode: Ref<boolean>,
) {
  const hasUnsavedChanges = computed(() => {
    if (createMode.value) return false;
    const current = JSON.stringify(currentData.value);
    // console.log('🚀 ~ hasUnsavedChanges ~ current:', current);
    // console.log(
    //   '🚀 ~ hasUnsavedChanges ~ originalData.value:',
    //   originalData.value,
    // );
    return current !== originalData.value;
  });

  const unsavedChangesDialogOpen = ref(false);
  const leavingTo = ref<string | null>(null);
  const confirmedLeave = ref(false);

  onBeforeRouteLeave((to) => {
    if (!confirmedLeave.value && hasUnsavedChanges.value) {
      unsavedChangesDialogOpen.value = true;
      leavingTo.value = to.fullPath;
      return false;
    }
    return true;
  });

  const confirmLeave = () => {
    unsavedChangesDialogOpen.value = false;
    confirmedLeave.value = true;

    if (leavingTo.value) {
      navigateTo(leavingTo.value);
    }
  };

  return {
    hasUnsavedChanges,
    unsavedChangesDialogOpen,
    confirmLeave,
  };
}
