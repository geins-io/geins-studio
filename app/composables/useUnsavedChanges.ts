interface UseUnsavedChangesReturnType {
  hasUnsavedChanges: ComputedRef<boolean>;
  unsavedChangesDialogOpen: Ref<boolean>;
  confirmLeave: () => void;
}

/**
 * Composable for tracking and managing unsaved changes in forms.
 *
 * Provides detection of unsaved changes, navigation guards, and user
 * confirmation dialogs when attempting to leave with unsaved data.
 *
 * @template T - The type of data being tracked for changes
 * @param currentData - Current form/entity data
 * @param originalData - Original data as JSON string for comparison
 * @param createMode - Whether in create mode (no unsaved changes tracking)
 * @param excludeFields - Fields to exclude from change detection
 * @returns {UseUnsavedChangesReturnType} - An object containing unsaved changes state and actions
 * @property {ComputedRef<boolean>} hasUnsavedChanges - Whether there are unsaved changes
 * @property {Ref<boolean>} unsavedChangesDialogOpen - Whether the confirmation dialog is open
 * @property {function} confirmLeave - Confirms leaving the page with unsaved changes
 */
export function useUnsavedChanges<T extends Record<string, unknown>>(
  currentData: Ref<T>,
  originalData: Ref<string>,
  createMode: Ref<boolean>,
  excludeFields?: string[],
): UseUnsavedChangesReturnType {
  const { geinsLogInfo } = useGeinsLog('composables/useUnsavedChanges.ts');

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
      // geinsLogInfo('current :::', JSON.stringify(current));
      // geinsLogInfo('original :::', JSON.stringify(original));
      return JSON.stringify(current) !== JSON.stringify(original);
    }
    // geinsLogInfo('current :::', current);
    // geinsLogInfo('original :::', originalData.value);
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
