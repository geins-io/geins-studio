<script setup lang="ts">
import {
  Search,
  MoonStar,
  Sun,
  User,
  LogOut,
  CircleHelp,
  CreditCard,
} from 'lucide-vue-next';

const auth = useAuth();
const { user, userInitials } = useUserStore();

const colorMode = useColorMode();
const setColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>
<template>
  <header
    class="text-background-foreground flex flex-none items-center justify-start bg-card"
  >
    <div class="relative w-full max-w-sm items-center">
      <Input
        id="search"
        type="text"
        :placeholder="$t('global_search_placeholder')"
        class="bg-popover pl-10"
      />
      <span
        class="absolute inset-y-0 start-0 flex items-center justify-center px-2"
      >
        <Search class="size-5 text-foreground" />
      </span>
    </div>
    <div class="ml-auto mr-5">
      <NuxtLink to="/" class="flex items-center gap-1.5">
        <CircleHelp class="size-4" />
        <span class="text-sm">Help center</span>
      </NuxtLink>
    </div>
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
    <div class="mr-5">
      <DropdownMenu>
        <DropdownMenuTrigger class="size-10">
          <Avatar class="size-10 border">
            <AvatarFallback>{{ userInitials }}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <NuxtLink class="flex items-center" :to="`/user/${user?.id}`">
              <User class="mr-2 size-4" />
              <span>Profile</span>
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard class="mr-2 size-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="setColorMode">
            <Sun class="mr-2 size-4 dark:hidden" />
            <MoonStar class="mr-2 hidden size-4 dark:block" />
            <span class="dark:hidden">Dark mode</span>
            <span class="hidden dark:block">Light mode</span>
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="auth.signOut()">
            <LogOut class="mr-2 size-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
