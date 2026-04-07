<script setup lang="ts">
type ButtonIconAlias =
  | 'new'
  | 'save'
  | 'copy'
  | 'export'
  | 'settings'
  | 'send'
  | 'retry';

const props = withDefaults(
  defineProps<{
    icon: ButtonIconAlias | (string & {});
    href?: string;
  }>(),
  {
    href: '',
  },
);

const { resolveIcon } = useLucideIcon();

const aliasMap: Record<ButtonIconAlias, string> = {
  new: 'Plus',
  save: 'Save',
  copy: 'Copy',
  export: 'File',
  settings: 'Settings2',
  send: 'Send',
  retry: 'RotateCw',
};

const iconComponent = computed(() =>
  resolveIcon(aliasMap[props.icon as ButtonIconAlias] ?? props.icon),
);

const link = resolveComponent('NuxtLink');
const elem = props.href ? link : 'div';
</script>
<template>
  <Button :as-child="!!href">
    <component :is="elem" :to="href" class="flex">
      <component :is="iconComponent" class="mr-2 size-4" />
      <slot />
    </component>
  </Button>
</template>
