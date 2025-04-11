<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    step: number;
    currentStep: number;
    title: string;
    createMode: boolean;
    description?: string;
  }>(),
  {
    step: 1,
    currentStep: 1,
  },
);

const stepTitle = computed(() => {
  return `${props.step}. ${props.title}`;
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
</script>

<template>
  <Card>
    <Collapsible v-model:open="isOpen">
      <CollapsibleTrigger
        v-if="createMode"
        class="flex w-full items-center justify-between p-6"
      >
        <div class="text-left">
          <h3 class="text-xl font-semibold">{{ stepTitle }}</h3>
          <p v-if="description" class="mt-1 text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>

        <LucideChevronDown
          :class="
            cn(`size-6 transition-transform ${isOpen ? 'rotate-180' : ''}`)
          "
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="p-6 pt-0">
          <slot />
        </div>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>
