<script setup lang="ts">
import { useSidebar } from '@/components/ui/sidebar';
const { state, toggleSidebar } = useSidebar();

const route = useRoute();
const { getEntityListUrl } = useEntityUrl(route.fullPath);
const listPageUrl = getEntityListUrl();
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
    <Breadcrumb class="ml-4 border-l pl-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <NuxtLink to="/wholesale/account/list">Wholesale</NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem v-if="listPageUrl">
          <BreadcrumbLink as-child>
            <NuxtLink :to="listPageUrl">{{ route.meta.title }}</NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="listPageUrl" />
        <!--       <BreadcrumbItem>
        <DropdownMenu>
          <DropdownMenuTrigger class="flex items-center gap-1">
            <BreadcrumbEllipsis class="size-4" />
            <span class="sr-only">Toggle menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Documentation</DropdownMenuItem>
            <DropdownMenuItem>Themes</DropdownMenuItem>
            <DropdownMenuItem>GitHub</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/docs/components/accordion.html">
          Components
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator /> -->
        <BreadcrumbItem>
          <BreadcrumbPage>{{ route.meta.title }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
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
  </header>
</template>
