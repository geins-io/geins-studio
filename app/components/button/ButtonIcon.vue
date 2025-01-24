<script setup lang="ts">
import type { ConcreteComponent } from 'vue';

type ButtonIcon = 'new' | 'save' | 'copy' | 'export' | 'settings';

const props = withDefaults(
  defineProps<{
    icon: ButtonIcon;
    href?: string;
  }>(),
  {
    href: '',
  },
);

let iconComponent: ConcreteComponent | string;

switch (props.icon) {
  case 'new':
    iconComponent = resolveComponent('LucidePlus');
    break;
  case 'save':
    iconComponent = resolveComponent('LucideSave');
    break;
  case 'copy':
    iconComponent = resolveComponent('LucideCopy');
    break;
  case 'export':
    iconComponent = resolveComponent('LucideFile');
    break;
  case 'settings':
    iconComponent = resolveComponent('LucideSettings2');
    break;
}

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
