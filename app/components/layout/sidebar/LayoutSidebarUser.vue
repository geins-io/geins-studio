<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/components/ui/toast/use-toast';
import LogoLetter from '@/assets/logos/geins-g.svg';

const { geinsLogError } = useGeinsLog('components/../LayoutSidebarUser.vue');
const { session, setAccount, logout } = useGeinsAuth();
const userStore = useUserStore();
const { showErrorToast } = usePageError();
const {
  userName,
  userInitials,
  userEmail,
  userAccounts,
  currentAccountName,
  hasMultipleAccounts,
} = storeToRefs(userStore);

const colorMode = useColorMode();
const setColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const { isMobile } = useSidebar();

const setNewAccount = async (accountKey: string) => {
  try {
    await setAccount(accountKey);
    window.location.href = '/';
  } catch (error) {
    showErrorToast();
    geinsLogError('error switching account:', error);
    return;
  }
};
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
            <DropdownMenuSubTrigger class="text-xs">
              <LogoLetter class="mr-2 size-4" :font-controlled="false" />
              {{ currentAccountName }}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent class="max-h-[50vh] overflow-auto">
                <DropdownMenuItem
                  v-for="account in userAccounts"
                  :key="account.accountKey"
                  @click="setNewAccount(account.accountKey)"
                >
                  <span class="pr-2">
                    {{ account.displayName }}
                  </span>
                  <LucideCheck
                    v-if="account.accountKey === session?.accountKey"
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
                <span>{{ $t('account') }}</span>
              </NuxtLink>
            </DropdownMenuItem>
            <DropdownMenuItem @click="logout()">
              <LucideLogOut class="mr-2 size-4" />
              <span>{{ $t('log_out') }}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="setColorMode">
            <LucideSun class="mr-2 hidden size-4 dark:block" />
            <LucideMoonStar class="mr-2 size-4 dark:hidden" />
            <span class="dark:hidden">{{ $t('dark_mode') }}</span>
            <span class="hidden dark:block">{{ $t('light_mode') }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
