<script setup lang="ts">
import Logo from '@/assets/logos/geins.svg';
import LogoLetter from '@/assets/logos/geins-g.svg';
import { ChevronsLeft } from 'lucide-vue-next';

const props = defineProps<{
  open?: boolean;
  isCollapsed?: boolean;
}>();

const isCollapsed = ref(props.isCollapsed);
const setIsCollapsed = (value: boolean) => {
  isCollapsed.value = value;
};
</script>
<template>
  <aside
    :class="
      cn(
        `layout-sidebar ${isCollapsed ? 'w-[3.75rem]' : 'w-60'} relative bg-card transition-[width]`,
      )
    "
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
        class="absolute -right-4 top-1/2 z-50 hidden size-7 rounded-full border bg-card md:inline-flex"
        @click="setIsCollapsed(!isCollapsed)"
      >
        <ChevronsLeft
          :class="
            cn(`size-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`)
          "
        />
      </Button>
    </div>
  </aside>
</template>
