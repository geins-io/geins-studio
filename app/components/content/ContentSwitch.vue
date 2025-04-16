<script setup lang="ts">
const _props = defineProps<{
  label: string;
  description?: string;
}>();

const checked = defineModel<boolean>('checked');

const beforeEnter = (el: Element) => {
  (el as HTMLElement).style.height = '0';
};

const enter = (el: Element) => {
  (el as HTMLElement).style.height = (el as HTMLElement).scrollHeight + 'px';
};

const beforeLeave = (el: Element) => {
  (el as HTMLElement).style.height = (el as HTMLElement).scrollHeight + 'px';
};

const leave = (el: Element) => {
  (el as HTMLElement).style.height = '0';
};
</script>
<template>
  <div class="rounded-lg border p-4 text-sm">
    <div class="flex flex-row items-center justify-between">
      <ContentCardHeader
        :title="label"
        :description="description"
        size="sm"
        heading-level="h4"
      />
      <div>
        <Switch v-model:checked="checked" />
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
        class="overflow-hidden pt-4 transition-all duration-300"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>
