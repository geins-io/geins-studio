# `useStepManagement`

The `useStepManagement` composable provides state management and navigation utilities for multi-step workflows, like the entity create mode wizard. It helps track the current step, navigate between steps, and enforce step boundaries.

## Features

- **Step state management** with reactive current step tracking

## Usage

### Basic Usage

```ts
// Create a 5-step workflow
const {
  currentStep,
  nextStep,
  previousStep,
  goToStep,
  isFirstStep,
  isLastStep,
} = useStepManagement(5);

console.log(currentStep.value); // 1 (starts at first step)
console.log(isFirstStep.value); // true
console.log(isLastStep.value); // false

// Navigate through steps
nextStep(); // currentStep becomes 2
previousStep(); // currentStep becomes 1
goToStep(3); // currentStep becomes 3
```

## Parameters

### `totalSteps`

```ts
totalSteps: number;
```

The total number of steps in the workflow. Must be a positive integer.

- **Range**: Must be ≥ 1
- **Usage**: Defines the maximum step number for bounds checking
- **Step numbering**: Steps are numbered from 1 to `totalSteps` (inclusive)

## Properties and Methods

### `currentStep`

A `ref` representing the current step number.

### `isFirstStep`

A `computed` property indicating whether currently on the first step.

### `isLastStep`

A `computed` property indicating whether currently on the last step.

### `nextStep`

```ts
nextStep(): void
```

Advances to the next step if not already at the last step.

- **Behavior**: Increments `currentStep` by 1
- **Bounds checking**: Does nothing if already at `totalSteps`
- **Safe to call**: Won't exceed maximum step

### `previousStep`

```ts
previousStep(): void
```

Goes back to the previous step if not already at the first step.

- **Behavior**: Decrements `currentStep` by 1
- **Bounds checking**: Does nothing if already at step 1
- **Safe to call**: Won't go below minimum step

### `goToStep`

```ts
goToStep(step: number): void
```

Jumps directly to a specific step within the valid range.

- **Parameters**:
  - `step`: Target step number (1-indexed)

- **Behavior**: Sets `currentStep` to the specified value
- **Bounds checking**: Only sets if step is between 1 and `totalSteps`

## Type Definitions

```ts
function useStepManagement(totalSteps: number): UseStepManagementReturnType;

interface UseStepManagementReturnType {
  currentStep: Ref<number>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: ComputedRef<boolean>;
  isLastStep: ComputedRef<boolean>;
}
```
