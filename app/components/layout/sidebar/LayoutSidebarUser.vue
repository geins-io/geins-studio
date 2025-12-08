<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar';

const { logout } = useGeinsAuth();
const userStore = useUserStore();
const { userName, userInitials, userEmail } = storeToRefs(userStore);

const colorMode = useColorMode();
const setColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const { isMobile } = useSidebar();

const auth = useGeinsAuth();
const setAccount = async (accountKey: string) => {
  await auth.setAccount(accountKey);
  window.location.href = '/';
};

const user = useUserStore();
const { userAccounts, currentAccountName, hasMultipleAccounts } =
  storeToRefs(user);
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
            <LucideEllipsisVertical class="ml-auto size-4" />
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
          <DropdownMenuSeparator v-if="hasMultipleAccounts" />
          <DropdownMenuSub v-if="hasMultipleAccounts">
            <DropdownMenuSubTrigger>
              <LucideEarth class="mr-2 size-4" />
              {{ currentAccountName }}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  v-for="acc in userAccounts"
                  @click="setAccount(acc.accountKey)"
                >
                  <span class="pr-2">
                    {{ acc.displayName }}
                  </span>
                  <LucideCheck
                    v-if="acc.accountKey === auth.session.value?.accountKey"
                    class="ml-auto"
                  />
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem as-child>
              <NuxtLink :to="`/account/profile`">
                <LucideUser class="mr-2 size-4" />
                <span>Account</span>
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem @click="logout()">
              <LucideLogOut class="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="setColorMode">
            <LucideSun class="mr-2 hidden size-4 dark:block" />
            <LucideMoonStar class="mr-2 size-4 dark:hidden" />
            <span class="dark:hidden">Dark mode</span>
            <span class="hidden dark:block">Light mode</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
