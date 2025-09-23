<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar';

const { logout } = useGeinsAuth();
const { userName, userInitials, userEmail } = useUserStore();

const colorMode = useColorMode();
const setColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const { isMobile } = useSidebar();
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="mr-1 size-8 rounded-lg">
              <AvatarFallback class="rounded-lg">
                {{ userInitials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span v-if="userName" class="truncate font-semibold">{{
                userName
              }}</span>
              <span class="truncate text-xs">{{ userEmail }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="mr-1 size-8 rounded-lg">
                <AvatarFallback class="rounded-lg border">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span v-if="userName" class="truncate font-semibold">{{
                  userName
                }}</span>
                <span class="truncate text-xs">{{ userEmail }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="setColorMode">
              <LucideSun class="mr-2 hidden size-4 dark:block" />
              <LucideMoonStar class="mr-2 size-4 dark:hidden" />
              <span class="dark:hidden">Dark mode</span>
              <span class="hidden dark:block">Light mode</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="logout()">
            <LucideLogOut class="mr-2 size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
