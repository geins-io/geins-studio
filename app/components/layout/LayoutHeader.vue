<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar';
const { logout } = useGeinsAuth();
const { userInitials } = useUserStore();

const colorMode = useColorMode();
const setColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const { state, toggleSidebar } = useSidebar();
</script>
<template>
  <header
    class="text-background-foreground bg-card flex flex-none items-center justify-start border-b"
  >
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="outline"
      size="icon"
      class="ml-3 size-7"
      @click="toggleSidebar"
    >
      <LucidePanelLeftOpen
        class="text-muted-foreground size-4"
        v-if="state === 'collapsed'"
      />
      <LucidePanelLeftClose class="text-muted-foreground size-4" v-else />
      <span class="sr-only">Toggle Sidebar</span>
    </Button>
    <div class="relative ml-5 w-full max-w-96 items-center">
      <!--   <Input
        id="search"
        type="text"
        :placeholder="$t('global_search_placeholder')"
        class="bg-input pl-10"
      />
      <span
        class="absolute inset-y-0 start-0 flex items-center justify-center px-2"
      >
        <LucideSearch class="size-5 text-foreground" />
      </span>-->
    </div>
    <!--  <div class="ml-auto mr-5">
      <NuxtLink to="/" class="flex items-center gap-1.5">
        <LucideCircleHelp class="size-4" />
        <span class="text-sm">Help center</span>
      </NuxtLink>
    </div> -->
    <!--  <div class="mr-4">
      <Button
        variant="secondary"
        size="icon"
        class="rounded-full w-8 h-8"
        @click="setColorMode"
      >
        <Sun
          class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <MoonStar
          class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
      </Button>
    </div> -->
    <div class="mr-3 ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger class="size-8">
          <Avatar class="size-8 border">
            <AvatarFallback>{{ userInitials }}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-48">
          <DropdownMenuLabel class="text-sm">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <!--           <DropdownMenuItem>
            <NuxtLink
              class="flex items-center"
              :to="`/account/user/${user?.username}`"
            >
              <LucideUser class="mr-2 size-4" />
              <span>Profile</span>
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LucideCreditCard class="mr-2 size-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator /> -->
          <DropdownMenuItem @click="setColorMode">
            <LucideSun class="mr-2 hidden size-4 dark:block" />
            <LucideMoonStar class="mr-2 size-4 dark:hidden" />
            <span class="dark:hidden">Dark mode</span>
            <span class="hidden dark:block">Light mode</span>
            <!-- <DropdownMenuShortcut>⌘C</DropdownMenuShortcut> -->
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="logout()">
            <LucideLogOut class="mr-2 size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
