export function useUnsavedChanges<T extends Record<string, unknown>>(
  currentData: Ref<T>,
  originalData: Ref<string>,
  createMode: Ref<boolean>,
  excludeFields?: string[],
) {
  const hasUnsavedChanges = computed(() => {
    if (createMode.value) return false;
    const current = JSON.stringify(currentData.value);

    if (excludeFields?.length) {
      const currentCopy = { ...currentData.value };
      const originalCopy = { ...JSON.parse(originalData.value) };

      const current = Object.fromEntries(
        Object.entries(currentCopy).filter(
          ([key]) => !excludeFields.includes(key),
        ),
      );
      const original = Object.fromEntries(
        Object.entries(originalCopy).filter(
          ([key]) => !excludeFields.includes(key),
        ),
      );
      // console.log('🚀 ~ hasUnsavedChanges ~ current:', JSON.stringify(current));
      // console.log(
      //   '🚀 ~ hasUnsavedChanges ~ original:',
      //   JSON.stringify(original),
      // );
      return JSON.stringify(current) !== JSON.stringify(original);
    }
    // console.log('🚀 ~ hasUnsavedChanges ~ current:', current);
    // console.log(
    //   '🚀 ~ hasUnsavedChanges ~ original:',
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
