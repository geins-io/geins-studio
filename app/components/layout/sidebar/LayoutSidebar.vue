<script setup lang="ts">
import {
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '@/components/ui/sidebar/utils';
import { useSidebar } from '@/components/ui/sidebar';

import Logo from '@/assets/logos/geins.svg';
import LogoLetter from '@/assets/logos/geins-g.svg';

// Import icons dynamically
import {
  LucideChevronDown,
  LucideBrush,
  LucideBuilding2,
  LucideChartLine,
  LucideImport,
  LucideLayers,
  LucideLayoutDashboard,
  LucideSettings,
  LucideShieldCheck,
  LucideTag,
  LucideUsers,
  LucideWallet,
  LucideWarehouse,
  LucidePackage,
  Package,
} from 'lucide-vue-next';

const { state, isMobile, setOpenMobile } = useSidebar();

// Use the navigation composable for filtered, role-based navigation
const { navigationItems, isItemActive, isItemOpen } = useNavigation();

// Get route for checking active children
const route = useRoute();

// Handle navigation clicks on mobile - close sidebar when navigating
const handleNavClick = () => {
  if (isMobile.value) {
    setOpenMobile(false);
  }
};

// Icon component mapping
const iconComponents = {
  LayoutDashboard: LucideLayoutDashboard,
  ChartLine: LucideChartLine,
  Tag: LucideTag,
  Brush: LucideBrush,
  Users: LucideUsers,
  Warehouse: LucideWarehouse,
  Layers: LucideLayers,
  Wallet: LucideWallet,
  Building2: LucideBuilding2,
  Import: LucideImport,
  Settings: LucideSettings,
  ShieldCheck: LucideShieldCheck,
  Package: LucidePackage,
};

// Process navigation items to include icon components
const navigationMenu = computed(() => {
  return navigationItems.value
    .filter((item) => !item.hideFromMenu)
    .map((item) => ({
      ...item,
      iconComponent: item.icon
        ? iconComponents[item.icon as keyof typeof iconComponents]
        : undefined,
    }));
});

const sidebarOpen = useCookie<boolean>(SIDEBAR_COOKIE_NAME, {
  default: () => true,
  maxAge: SIDEBAR_COOKIE_MAX_AGE,
});
</script>

<template>
  <Sidebar collapsible="icon" class="overflow-hidden border-r">
    <!-- Header with Logo -->
    <SidebarHeader>
      <NuxtLink to="/" class="mt-0.5 ml-2" @click="handleNavClick">
        <Logo
          v-if="state === 'expanded' || isMobile"
          :font-controlled="false"
          class="h-8 w-auto"
        />
        <LogoLetter v-else :font-controlled="false" class="h-8 w-auto" />
      </NuxtLink>
    </SidebarHeader>

    <!-- Main Navigation Content -->
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navigationMenu" :key="item.label">
              <!-- Item with children (collapsible) :default-open="isItemOpen(item)" -->
              <Collapsible
                v-if="item.children?.length"
                :default-open="true"
                :disabled="!sidebarOpen"
                class="group/collapsible"
              >
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton class="w-full" as-child>
                    <NuxtLink
                      :to="
                        state === 'collapsed' && item.children?.length
                          ? item.children[0]?.href || item.href
                          : undefined
                      "
                      @click="handleNavClick"
                    >
                      <component
                        :is="item.iconComponent"
                        v-if="item.iconComponent"
                        class="!size-4.5"
                      />
                      <span>{{ item.label }}</span>

                      <LucideChevronRight
                        class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                      />
                    </NuxtLink>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub class="mt-0.5 pl-3">
                    <SidebarMenuSubItem
                      v-for="child in item.children"
                      :key="child.label"
                    >
                      <SidebarMenuSubButton
                        as-child
                        :is-active="route.path === child.href"
                        size="sm"
                      >
                        <NuxtLink :to="child.href" @click="handleNavClick">
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
                :tooltip="item.label"
                :is-active="isItemActive(item)"
              >
                <NuxtLink
                  :to="
                    item.children?.length
                      ? item.children[0]?.href || item.href
                      : item.href
                  "
                  @click="handleNavClick"
                >
                  <component
                    :is="item.iconComponent"
                    v-if="item.iconComponent"
                    class="!size-4.5"
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
    <SidebarFooter class="mx-2 border-t px-0">
      <LayoutSidebarUser />
    </SidebarFooter>
  </Sidebar>
</template>
