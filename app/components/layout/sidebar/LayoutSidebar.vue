<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar';
import {
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
} from '@/components/ui/sidebar/utils';

const { state, isMobile, setOpenMobile } = useSidebar();
const { brand } = useBrand();

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

const { t } = useI18n();
const { resolveIcon } = useLucideIcon();

// Group label translations keyed by navigation group
const groupLabels = computed<Record<string, string>>(() => ({
  workspace: t('navigation.workspace'),
  settings: t('navigation.settings'),
}));

// Process navigation items to include icon components
const navigationMenu = computed(() => {
  return navigationItems.value
    .filter((item) => !item.hideFromMenu)
    .map((item) => ({
      ...item,
      iconComponent: resolveIcon(item.icon),
    }));
});

// Group navigation items by their `group` property, preserving insertion order
const groupedNavigation = computed(() => {
  const groups = new Map<string, typeof navigationMenu.value>();
  for (const item of navigationMenu.value) {
    const key = item.group || 'workspace';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  return groups;
});

const sidebarOpen = useCookie<boolean>(SIDEBAR_COOKIE_NAME, {
  default: () => true,
  maxAge: SIDEBAR_COOKIE_MAX_AGE,
});
</script>

<template>
  <Sidebar collapsible="icon" class="overflow-hidden border-r">
    <!-- Header with Logo -->
    <SidebarHeader class="p-0">
      <NuxtLink
        to="/"
        class="flex h-(--h-header) items-center pl-[0.95rem]"
        @click="handleNavClick"
      >
        <BrandLogoFull
          v-if="state === 'expanded' || isMobile"
          :font-controlled="false"
          class="h-full w-auto shrink-0"
          :style="{ maxHeight: brand.logoMaxHeight }"
        />
        <BrandLogoSymbol
          v-else
          :font-controlled="false"
          class="h-full w-auto max-w-5 shrink-0"
          :style="{ maxHeight: brand.logoMaxHeight }"
        />
      </NuxtLink>
    </SidebarHeader>

    <!-- Main Navigation Content -->
    <SidebarContent>
      <SidebarGroup
        v-for="[groupKey, items] in groupedNavigation"
        :key="groupKey"
      >
        <SidebarGroupLabel>
          {{ groupLabels[groupKey] ?? groupKey }}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.label">
              <!-- Item with children (collapsible) -->
              <Collapsible
                v-if="item.children?.length"
                :default-open="isItemOpen(item) || (item.defaultOpen ?? true)"
                :disabled="!sidebarOpen"
                class="group/collapsible"
              >
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    class="w-full cursor-pointer"
                    :tooltip="state === 'collapsed' ? item.label : undefined"
                    as-child
                  >
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
                        class="size-4.5!"
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
                    class="size-4.5!"
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
