<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    step?: number;
    currentStep?: number;
    totalSteps?: number;
    title?: string;
    createMode?: boolean;
    description?: string;
    stepValid?: boolean;
  }>(),
  {
    step: 1,
    currentStep: 1,
    totalSteps: 1,
    createMode: false,
    title: '',
    description: '',
    stepValid: true,
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
const isCurrentStep = computed(() => {
  return props.createMode && props.step === props.currentStep;
});

const changeStep = (direction: 'previous' | 'next') => {
  emit(direction);
};

const slots = useSlots();
const hasCreateView = computed(() => !!slots.create);
</script>

<template>
  <Card>
    <Collapsible v-model:open="isOpen" :unmount-on-hide="false">
      <CollapsibleTrigger
        :class="
          cn(
            `flex w-full items-center justify-between p-6`,
            `${futureStep ? 'pointer-events-none opacity-50' : ''}`,
          )
        "
        :disabled="futureStep || !createMode"
      >
        <ContentCardHeader
          :title="stepTitle"
          :description="description"
          class="max-w-[650px]"
        />

        <LucideChevronDown
          v-if="createMode"
          :class="
            cn(`size-6 transition-transform ${isOpen ? 'rotate-180' : ''}`)
          "
        />
        <slot name="header-action" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div :class="cn('space-y-8 p-6 pt-0', `${createMode ? '' : 'pb-8'}`)">
          <slot v-if="hasCreateView && createMode" name="create" />
          <slot v-else />
          <div
            v-if="createMode"
            class="flex items-center justify-between border-t border-dashed pt-6"
          >
            <Button
              v-if="!firstStep"
              class="mr-auto"
              variant="secondary"
              :disabled="!isCurrentStep"
              @click="changeStep('previous')"
            >
              {{ $t('previous') }}
            </Button>
            <Button
              v-if="!lastStep"
              class="ml-auto"
              :disabled="!isCurrentStep"
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
