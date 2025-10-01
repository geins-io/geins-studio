export function useStepManagement(totalSteps: number) {
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
