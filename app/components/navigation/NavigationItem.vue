<script setup lang="ts">
import {
  LucideBrush,
  LucideBuilding2,
  LucideChartLine,
  LucideImport,
  LucideLayers,
  LucideSettings,
  LucideShieldCheck,
  LucideTag,
  LucideUser,
  LucideWallet,
  LucideWarehouse,
} from '#components';
import type { NavigationItem } from '#shared/types';

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
    component: LucideChartLine,
  },
  {
    name: 'Tag',
    component: LucideTag,
  },
  {
    name: 'Brush',
    component: LucideBrush,
  },
  {
    name: 'User',
    component: LucideUser,
  },
  {
    name: 'Warehouse',
    component: LucideWarehouse,
  },
  {
    name: 'Layers',
    component: LucideLayers,
  },
  {
    name: 'Wallet',
    component: LucideWallet,
  },
  {
    name: 'Building2',
    component: LucideBuilding2,
  },
  {
    name: 'Import',
    component: LucideImport,
  },
  {
    name: 'Settings',
    component: LucideSettings,
  },
  {
    name: 'ShieldCheck',
    component: LucideShieldCheck,
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
    ? `py-1.5 pl-5 pr-3 text-sm h-12 leading-10 transition-[background-color]`
    : `py-2 pl-[3.25rem] pr-5 text-xs ${isActive.value ? 'font-medium border-primary bg-background' : ''}`;
});
</script>

<template>
  <div :class="`relative ${isCollapsed ? 'group' : ''}`">
    <Collapsible
      v-if="item.children?.length && !isCollapsed"
      v-model:open="isOpen"
    >
      <div
        :class="cn(`flex w-full items-center justify-between`, rootItemClasses)"
      >
        <NuxtLink :to="item.href" :class="cn(`flex flex-grow items-center`)">
          <!--TODO: solve the issue with clientonly for dynamic icons-->
          <ClientOnly>
            <component :is="item.icon" stroke-width="1.5" class="mr-3 size-5" />
          </ClientOnly>
          <span class="flex grow hover:underline">{{ item.label }}</span>
        </NuxtLink>
        <CollapsibleTrigger as-child>
          <Button
            variant="ghost"
            class="inline-flex size-7 items-center justify-center p-0"
          >
            <LucideChevronDown
              :class="
                cn(`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`)
              "
            />
          </Button>
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
          `flex items-center ${isCollapsed ? 'transition-colors hover:bg-background' : ''} ${isCollapsed && isActive ? 'bg-background' : ''} ${isActive ? 'font-medium' : ''}`,
          rootItemClasses,
        )
      "
    >
      <ClientOnly>
        <component
          :is="item.icon"
          stroke-width="1.5"
          :class="cn(`size-5 ${isCollapsed ? '' : 'mr-3'}`)"
        />
      </ClientOnly>
      <span
        v-show="!isCollapsed"
        class="flex grow items-center justify-between hover:underline"
      >
        {{ item.label }}
        <LucideChevronRight
          v-if="isActive"
          :class="cn(`size-4 text-muted ${root ? 'mr-1.5' : ''}`)"
        />
      </span>
    </NuxtLink>

    <!-- Child items for collapsed state with hover fix -->
    <div
      v-if="isCollapsed && item.children?.length"
      class="absolute left-full top-0 z-50 hidden w-48 rounded-lg bg-card pl-2 shadow-lg group-hover:block"
    >
      <NuxtLink :to="item.href" class="block px-4 pb-2 pt-4 text-sm">
        <span class="hover:underline">{{ item.label }}</span>
      </NuxtLink>
      <ul>
        <li
          v-for="(child, index) in item.children"
          :key="index"
          class="[&:first-child>a]:pt-3 [&:last-child>a]:pb-3"
        >
          <NuxtLink
            :to="child.href"
            class="flex items-center justify-between bg-card px-4 py-2 text-xs hover:underline"
            >{{ child.label }}
            <LucideChevronRight
              v-if="route.path === child.href"
              :class="cn(`size-4 text-muted`)"
            />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>
