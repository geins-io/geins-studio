<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    step?: number;
    currentStep?: number;
    totalSteps?: number;
    title?: string;
    createMode?: boolean;
    description?: string;
  }>(),
  {
    step: 1,
    currentStep: 1,
    totalSteps: 1,
    createMode: false,
  },
);

const emit = defineEmits(['previous', 'next']);

const stepTitle = computed(() => {
  return props.createMode ? `${props.step}. ${props.title}` : props.title;
});

const open = props.createMode ? props.step === props.currentStep : true;
const isOpen = ref(open);

if (props.createMode) {
  watch(
    () => props.currentStep,
    (value) => {
      isOpen.value = props.step === value;
    },
  );
}

const firstStep = computed(() => {
  return props.step === 1;
});
const lastStep = computed(() => {
  return props.step === props.totalSteps;
});
const futureStep = computed(() => {
  return props.createMode && props.step > props.currentStep;
});

const changeStep = (direction: 'previous' | 'next') => {
  emit(direction);
};
</script>

<template>
  <Card>
    <Collapsible v-model:open="isOpen">
      <CollapsibleTrigger
        :class="
          cn(
            `flex w-full items-center justify-between p-6`,
            `${!createMode ? 'pointer-events-none' : ''}`,
            `${futureStep ? 'pointer-events-none opacity-50' : ''}`,
          )
        "
      >
        <div class="text-left">
          <h3 class="text-xl font-semibold">{{ stepTitle }}</h3>
          <p v-if="description" class="mt-1 text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>

        <LucideChevronDown
          v-if="createMode"
          :class="
            cn(`size-6 transition-transform ${isOpen ? 'rotate-180' : ''}`)
          "
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="p-6 pt-0">
          <slot />
          <div
            class="mt-6 flex items-center justify-between border-t border-dashed pt-6"
          >
            <Button
              v-if="!firstStep"
              class="mr-auto"
              variant="secondary"
              @click="changeStep('previous')"
            >
              {{ $t('previous') }}
            </Button>
            <Button
              v-if="!lastStep"
              class="ml-auto"
              @click="changeStep('next')"
            >
              {{ $t('next') }}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>
