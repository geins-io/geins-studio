<script setup lang="ts">
import { type NavigationItem } from '@/types/NavigationItem';
import {
  ChevronDown,
  ChevronRight,
  Gauge,
  ShoppingBasket,
  Brush,
  User,
  Warehouse,
  Layers,
  Coins,
  BarChart3,
  Import,
  Settings,
  ShieldCheck,
} from 'lucide-vue-next';
import { cn } from '~/lib/utils';

const props = withDefaults(
  defineProps<{
    item: NavigationItem;
    root?: boolean;
    isCollapsed?: boolean;
  }>(),
  {
    root: true,
    isCollapsed: false,
  },
);

const item = ref(props.item);
const iconComponents = [
  {
    name: 'Gauge',
    component: Gauge,
  },
  {
    name: 'ShoppingBasket',
    component: ShoppingBasket,
  },
  {
    name: 'Brush',
    component: Brush,
  },
  {
    name: 'User',
    component: User,
  },
  {
    name: 'Warehouse',
    component: Warehouse,
  },
  {
    name: 'Layers',
    component: Layers,
  },
  {
    name: 'Coins',
    component: Coins,
  },
  {
    name: 'BarChart3',
    component: BarChart3,
  },
  {
    name: 'Import',
    component: Import,
  },
  {
    name: 'Settings',
    component: Settings,
  },
  {
    name: 'ShieldCheck',
    component: ShieldCheck,
  },
];

item.value.icon = iconComponents.find(
  (icon) => icon.name === item.value.icon,
)?.component;

const isOpen = ref(false);
const isCollapsed = ref(props.isCollapsed);

watch(
  () => props.isCollapsed,
  (value) => {
    if (value) {
      isCollapsed.value = value;
    } else {
      setTimeout(() => {
        isCollapsed.value = value;
      }, 150);
    }
  },
);

const route = useRoute();
const isActive = computed(() => {
  return route.path === item.value.href;
});
watch(
  () => route.path,
  (val) => {
    item.value.active = isActive.value;
    const children = item.value.children;
    children?.forEach((child) => {
      child.active = val === child.href;
    });
    isOpen.value = children?.length ? children.some((i) => i.active) : false;
  },
  { immediate: true },
);

const rootItemClasses = computed(() => {
  return props.root
    ? `navigation-item py-2 pl-5 pr-2 text-sm font-medium h-14 leading-10 transition-[background-color]`
    : `py-2 pl-6 pr-4 text-sm ${isActive.value ? 'font-medium' : ''}`;
});
</script>

<template>
  <Collapsible
    v-if="item.children?.length && !isCollapsed"
    v-model:open="isOpen"
  >
    <div
      :class="
        cn(
          `w-full flex items-center justify-between ${isCollapsed && isOpen ? 'bg-muted' : ''}`,
          rootItemClasses,
        )
      "
    >
      <NuxtLink :to="item.href" :class="cn(`flex flex-grow items-center`)">
        <component :is="item.icon" class="size-5 mr-3" />
        <span class="flex flex-grow hover:underline">{{ item.label }}</span>
      </NuxtLink>
      <CollapsibleTrigger
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border hover:text-accent-foreground size-9 border-transparent bg-transparent hover:bg-muted transition-colors"
      >
        <ChevronDown
          :class="
            cn(`transition-transform size-5 ${isOpen ? 'rotate-180' : ''}`)
          "
        />
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent>
      <ul class="py-2 bg-muted">
        <li v-for="(child, index) in item.children" :key="index">
          <NavigationItem :item="child" :root="false" />
        </li>
      </ul>
    </CollapsibleContent>
  </Collapsible>
  <NuxtLink
    v-else
    :to="item.href"
    :class="
      cn(
        `flex items-center ${isCollapsed ? 'transition-colors hover:bg-muted' : ''} ${isActive ? 'bg-muted' : ''}`,
        rootItemClasses,
      )
    "
  >
    <component :is="item.icon" class="size-5 mr-3" />
    <span
      v-show="!isCollapsed"
      class="flex flex-grow justify-between items-center hover:underline"
    >
      {{ item.label }}
      <ChevronRight
        v-if="isActive"
        :class="cn(`text-primary size-5 ${root ? 'mr-2' : ''}`)"
      />
    </span>
  </NuxtLink>
</template>
~/app/lib/utils ../../types/NavigationItem
