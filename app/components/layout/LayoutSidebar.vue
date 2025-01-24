<script setup lang="ts">
import Logo from '@/assets/logos/geins.svg';
import LogoLetter from '@/assets/logos/geins-g.svg';

const props = defineProps<{
  sidebarWidth: string;
}>();

const isCollapsed = defineModel<boolean>('collapsed');
const setIsCollapsed = (value: boolean) => {
  isCollapsed.value = value;
};

const sidebarStyle = computed(() => {
  return { width: props.sidebarWidth };
});
</script>
<template>
  <aside
    :class="cn(`layout-sidebar relative border-r bg-card transition-[width]`)"
    :style="sidebarStyle"
  >
    <div>
      <div class="ml-5 flex h-header items-center">
        <NuxtLink to="/">
          <LogoLetter v-if="isCollapsed" :font-controlled="false" class="h-9" />
          <Logo v-else :font-controlled="false" class="h-9" />
        </NuxtLink>
      </div>
      <NavigationList :is-collapsed="isCollapsed" />
      <Button
        variant="secondary"
        size="icon"
        class="absolute bottom-4 right-4 z-50 inline-flex size-7 border bg-card"
        @click="setIsCollapsed(!isCollapsed)"
      >
        <LucideChevronsLeft
          :class="
            cn(`size-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`)
          "
        />
      </Button>
    </div>
  </aside>
</template>
