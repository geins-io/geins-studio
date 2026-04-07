<script setup lang="ts">
const props = defineProps<{
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: string;
}>();

const checked = defineModel<boolean>('checked');

const { resolveIcon } = useLucideIcon();

const beforeEnter = (el: Element) => {
  (el as HTMLElement).style.height = '0';
};

const enter = (el: Element) => {
  (el as HTMLElement).style.height = (el as HTMLElement).scrollHeight + 'px';
  setTimeout(() => {
    (el as HTMLElement).style.height = 'auto';
  }, 300);
};

const beforeLeave = (el: Element) => {
  (el as HTMLElement).style.height = (el as HTMLElement).scrollHeight + 'px';
};

const leave = (el: Element) => {
  (el as HTMLElement).style.height = '0';
};

const slots = useSlots();
const hasSlotContent = computed(() => !!slots.default);
</script>
<template>
  <div class="rounded-lg border p-4 text-sm">
    <Item class="p-0">
      <ItemMedia v-if="icon" variant="icon">
        <component :is="resolveIcon(icon)" class="text-muted-foreground" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{{ label }}</ItemTitle>
        <ItemDescription v-if="description">
          {{ description }}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch v-model="checked" :disabled="props.disabled" />
      </ItemActions>
    </Item>
    <transition
      v-if="hasSlotContent"
      @before-enter="beforeEnter"
      @enter="enter"
      @before-leave="beforeLeave"
      @leave="leave"
    >
      <div
        v-show="checked"
        :data-state="checked ? 'open' : 'closed'"
        class="overflow-hidden p-px pt-4 transition-all duration-300"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>
