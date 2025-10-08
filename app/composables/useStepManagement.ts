interface UseStepManagementReturnType {
  currentStep: Ref<number>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: ComputedRef<boolean>;
  isLastStep: ComputedRef<boolean>;
}

/**
 * Composable for managing multi-step workflows and navigation.
 *
 * Provides state management and navigation utilities for step-based
 * processes with bounds checking and computed step states.
 *
 * @param totalSteps - Total number of steps in the workflow
 * @returns {UseStepManagementReturnType} - An object containing step management utilities
 * @property {Ref<number>} currentStep - Current active step (1-indexed)
 * @property {function} nextStep - Advances to the next step if available
 * @property {function} previousStep - Goes back to the previous step if available
 * @property {function} goToStep - Jumps to a specific step within bounds
 * @property {ComputedRef<boolean>} isFirstStep - Whether currently on the first step
 * @property {ComputedRef<boolean>} isLastStep - Whether currently on the last step
 */
export function useStepManagement(
  totalSteps: number,
): UseStepManagementReturnType {
  const currentStep = ref(1);

  const nextStep = () => {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  };

  const previousStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step;
    }
  };

  const isFirstStep = computed(() => currentStep.value === 1);
  const isLastStep = computed(() => currentStep.value === totalSteps);

  return {
    currentStep,
    nextStep,
    previousStep,
    goToStep,
    isFirstStep,
    isLastStep,
  };
}
