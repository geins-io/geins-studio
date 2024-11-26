<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    step: number;
    currentStep: number;
    title: string;
    createMode: boolean;
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
        class="flex h-14 w-full items-center justify-between border-b p-4"
      >
        {{ stepTitle }}
        <ChevronDown
          :class="
            cn(`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`)
          "
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="p-4">
          <slot />
        </div>
      </CollapsibleContent>
    </Collapsible>
  </Card>
</template>
