<script setup lang="ts">
import type { NavigationItem } from '@/types/NavigationItem';
import {
  ChevronDown,
  ChevronRight,
  ChartLine,
  ShoppingBasket,
  Brush,
  User,
  Warehouse,
  Layers,
  Wallet,
  Building2,
  Import,
  Settings,
  ShieldCheck,
} from 'lucide-vue-next';

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
    name: 'ChartLine',
    component: ChartLine,
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
    name: 'Wallet',
    component: Wallet,
  },
  {
    name: 'Building2',
    component: Building2,
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
    ? `navigation-item py-2 pl-5 pr-2 text-sm font-medium h-12 leading-10 transition-[background-color]`
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
          `flex w-full items-center justify-between ${isCollapsed && isOpen ? '' : ''}`,
          rootItemClasses,
        )
      "
    >
      <NuxtLink :to="item.href" :class="cn(`flex flex-grow items-center`)">
        <ClientOnly>
          <component :is="item.icon" stroke-width="1.5" class="mr-3 size-5" />
        </ClientOnly>
        <span class="flex grow hover:underline">{{ item.label }}</span>
      </NuxtLink>
      <CollapsibleTrigger
        class="inline-flex size-9 items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-transparent text-sm font-medium ring-offset-background transition-colors hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        <ChevronDown
          :class="
            cn(`size-5 transition-transform ${isOpen ? 'rotate-180' : ''}`)
          "
        />
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent>
      <ul class="border-b py-2">
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
        `flex items-center ${isCollapsed ? 'transition-colors hover:bg-background' : ''} ${isCollapsed && isActive ? 'bg-background' : ''}`,
        rootItemClasses,
      )
    "
  >
    <ClientOnly>
      <component :is="item.icon" stroke-width="1.5" class="mr-3 size-5" />
    </ClientOnly>
    <span
      v-show="!isCollapsed"
      class="flex grow items-center justify-between hover:underline"
    >
      {{ item.label }}
      <ChevronRight
        v-if="isActive"
        :class="cn(`size-5 text-muted ${root ? 'mr-2' : ''}`)"
      />
    </span>
  </NuxtLink>
</template>
