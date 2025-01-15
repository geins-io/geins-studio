<script setup lang="ts">
const props = defineProps<{
  checked: boolean;
  label: string;
  description?: string;
}>();

const value = ref(props.checked);

const emit = defineEmits<{
  (event: 'update:checked', value: boolean): void;
}>();

watch(value, (newValue) => {
  emit('update:checked', newValue);
});

const beforeEnter = (el: HTMLElement) => {
  el.style.height = '0';
};

const enter = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px';
};

const beforeLeave = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px';
};

const leave = (el: HTMLElement) => {
  el.style.height = '0';
};
</script>
<template>
  <div class="rounded-lg border p-4 text-sm">
    <div class="flex flex-row items-center justify-between">
      <div class="space-y-0.5">
        <p class="font-semibold">{{ label }}</p>
        <p v-if="description">{{ description }}</p>
      </div>
      <div>
        <Switch v-model:checked="value" />
      </div>
    </div>
    <transition
      @before-enter="beforeEnter"
      @enter="enter"
      @before-leave="beforeLeave"
      @leave="leave"
    >
      <div
        v-show="checked"
        :data-state="checked ? 'open' : 'closed'"
        class="overflow-hidden pt-4 transition-all"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>
