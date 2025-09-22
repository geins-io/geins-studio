<script setup lang="ts">
import Logo from '@/assets/logos/geins.svg';
import LogoLetter from '@/assets/logos/geins-g.svg';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { LucideChevronDown, LucideChevronsLeft } from 'lucide-vue-next';
import { navigation } from '@/lib/navigation';
import type { NavigationItem } from '#shared/types';

// Import icons dynamically
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
} from 'lucide-vue-next';

const { state, toggleSidebar } = useSidebar();

// Icon component mapping
const iconComponents = {
  ChartLine: LucideChartLine,
  Tag: LucideTag,
  Brush: LucideBrush,
  User: LucideUser,
  Warehouse: LucideWarehouse,
  Layers: LucideLayers,
  Wallet: LucideWallet,
  Building2: LucideBuilding2,
  Import: LucideImport,
  Settings: LucideSettings,
  ShieldCheck: LucideShieldCheck,
};

// Process navigation items to include icon components
const navigationMenu = computed(() => {
  return navigation.map((item) => ({
    ...item,
    iconComponent: iconComponents[item.icon as keyof typeof iconComponents],
  }));
});

const route = useRoute();

// Check if item or its children are active
const isItemActive = (item: NavigationItem) => {
  if (route.path === item.href) return true;
  return item.children?.some((child) => route.path === child.href) ?? false;
};

// Check if item should be open (has active children)
const isItemOpen = (item: NavigationItem) => {
  return item.children?.some((child) => route.path === child.href) ?? false;
};
</script>

<template>
  <Sidebar collapsible="icon" class="overflow-hidden border-r">
    <!-- Header with Logo -->
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink to="/">
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <LogoLetter
                  v-if="state === 'collapsed'"
                  :font-controlled="false"
                  class="size-6"
                />
                <LogoLetter v-else :font-controlled="false" class="size-6" />
              </div>
              <div
                v-if="state === 'expanded'"
                class="grid flex-1 text-left text-sm leading-tight"
              >
                <span class="truncate font-semibold">Geins Studio</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <!-- Main Navigation Content -->
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navigationMenu" :key="item.label">
              <!-- Item with children (collapsible) -->
              <Collapsible
                v-if="item.children?.length && state === 'expanded'"
                :default-open="isItemOpen(item)"
                class="group/collapsible"
              >
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :is-active="isItemActive(item)"
                    class="w-full"
                  >
                    <component
                      :is="item.iconComponent"
                      v-if="item.iconComponent"
                      class="!size-5"
                    />
                    <span>{{ item.label }}</span>
                    <LucideChevronDown
                      class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="child in item.children"
                      :key="child.label"
                    >
                      <SidebarMenuSubButton
                        as-child
                        :is-active="route.path === child.href"
                      >
                        <NuxtLink :to="child.href">
                          <span>{{ child.label }}</span>
                        </NuxtLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>

              <!-- Single item or collapsed state -->
              <SidebarMenuButton
                v-else
                as-child
                :is-active="isItemActive(item)"
              >
                <NuxtLink
                  :to="
                    item.children?.length
                      ? item.children[0]?.href || item.href
                      : item.href
                  "
                >
                  <component
                    :is="item.iconComponent"
                    v-if="item.iconComponent"
                    class="!size-5"
                  />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <!-- Footer with collapse button -->
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton @click="toggleSidebar" class="w-full">
            <LucideChevronsLeft
              :class="[
                'transition-transform',
                state === 'collapsed' ? 'rotate-180' : '',
              ]"
            />
            <span v-if="state === 'expanded'">Collapse Sidebar</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
