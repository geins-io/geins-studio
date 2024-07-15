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
const { avatarInitials } = useUserStore();
const colorMode = useColorMode();
const setColorMode = () => {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark';
};
const logout = () => {
  auth.signOut();
};
</script>
<template>
  <header
    class="flex flex-none items-center justify-start bg-background text-background-foreground"
  >
    <div class="relative w-full max-w-sm items-center">
      <Input
        id="search"
        type="text"
        :placeholder="$t('global_search_placeholder')"
        class="pl-10 bg-popover"
      />
      <span
        class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
      >
        <Search class="size-5 text-foreground" />
      </span>
    </div>
    <div class="ml-auto mr-4">
      <Button
        variant="outline"
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
    </div>
    <div class="mr-5">
      <DropdownMenu>
        <DropdownMenuTrigger class="h-10 w-10">
          <Avatar class="h-10 w-10 border">
            <AvatarFallback>{{ avatarInitials }}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard class="mr-2 h-4 w-4" />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CircleHelp class="mr-2 h-4 w-4" />
            <span>Help center</span>
            <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="logout">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
