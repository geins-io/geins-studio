<script setup lang="ts">
import type { NavigationItem } from '#shared/types';
import { navigation } from '@/lib/navigation';

const props = withDefaults(
  defineProps<{
    isCollapsed?: boolean;
  }>(),
  {
    isCollapsed: false,
  },
);

const navigationMenu = ref<NavigationItem[]>(navigation);

const route = useRoute();
navigationMenu.value.map((item) => {
  item.active = route.path === item.href;
  item.children?.map((child) => {
    child.active = route.path === child.href;
  });
});
</script>

<template>
  <nav class="navigation-list">
    <ul>
      <li v-for="(item, index) in navigationMenu" :key="index">
        <NavigationItem :item="item" :is-collapsed="props.isCollapsed" />
      </li>
    </ul>
  </nav>
</template>
