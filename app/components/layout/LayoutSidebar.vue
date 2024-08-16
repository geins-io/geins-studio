<script setup lang="ts">
import Logo from '@/assets/logos/geins.svg';
import LogoLetter from '@/assets/logos/geins-g.svg';
import { ChevronsLeft } from 'lucide-vue-next';
import { cn } from '@/lib/utils';

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
        `layout-sidebar ${isCollapsed ? 'w-[3.75rem]' : 'w-60'} relative transition-[width]`,
      )
    "
  >
    <div>
      <div class="flex items-center h-header ml-5">
        <NuxtLink to="/">
          <LogoLetter v-if="isCollapsed" :font-controlled="false" class="h-9" />
          <Logo v-else :font-controlled="false" class="h-9" />
        </NuxtLink>
      </div>
      <NavigationList :is-collapsed="isCollapsed" />
      <Button
        variant="outline"
        size="icon"
        class="absolute size-7 bg-background z-50 -right-4 top-1/2 hidden rounded-full md:inline-flex"
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
~/app/lib/utils
