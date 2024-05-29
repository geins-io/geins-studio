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
        `${isCollapsed ? 'w-14' : 'w-56'} relative bg-background text-background-foreground transition-[width]`,
      )
    "
  >
    <div>
      <div class="flex items-center h-header ml-5">
        <LogoLetter v-if="isCollapsed" :font-controlled="false" class="h-8" />
        <Logo v-else :font-controlled="false" class="h-8" />
      </div>
      <Button
        variant="outline"
        size="icon"
        class="absolute bg-background z-50 -right-5 top-1/2 hidden rounded-full md:inline-flex"
        @click="setIsCollapsed(!isCollapsed)"
      >
        <ChevronsLeft
          :class="
            cn(
              `h-5 w-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`,
            )
          "
        />
      </Button>
    </div>
  </aside>
</template>
