<script setup lang="ts">
import { type NavigationItem } from '@/types/NavigationItem';
import { mockNavigation } from '@/data/navigation';

const props = withDefaults(
  defineProps<{
    isCollapsed?: boolean;
  }>(),
  {
    isCollapsed: false,
  },
);

const navigationMenu = ref<NavigationItem[]>(mockNavigation);

const route = useRoute();
navigationMenu.value.map((item) => {
  item.active = route.path === item.href;
  item.children?.map((child) => {
    child.active = route.path === child.href;
  });
});
</script>

<template>
  <nav>
    <ul>
      <li v-for="(item, index) in navigationMenu" :key="index">
        <NavigationItem :item="item" :is-collapsed="props.isCollapsed" />
      </li>
    </ul>
  </nav>
</template>
