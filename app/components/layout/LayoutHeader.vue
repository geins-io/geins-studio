<script setup lang="ts">
import LogoLetter from '@/assets/logos/geins-g.svg';
import { useSidebar } from '@/components/ui/sidebar';
const { state, toggleSidebar } = useSidebar();

const breadcrumbsStore = useBreadcrumbsStore();
const { showBreadcrumbs, currentTitle, currentParent } =
  storeToRefs(breadcrumbsStore);
</script>
<template>
  <header
    v-auto-animate
    class="text-background-foreground bg-card flex flex-none items-center justify-start border-b"
  >
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      class="ml-2 size-7 flex-shrink-0 sm:ml-3"
      @click="toggleSidebar"
    >
      <LucidePanelLeftOpen
        class="text-muted-foreground size-4"
        v-if="state === 'collapsed'"
      />
      <LucidePanelLeftClose class="text-muted-foreground size-4" v-else />
      <span class="sr-only">Toggle Sidebar</span>
    </Button>
    <Breadcrumb
      v-if="showBreadcrumbs"
      class="ml-2 w-full border-l pr-2 pl-2 sm:ml-4 sm:pl-4"
    >
      <BreadcrumbList>
        <BreadcrumbItem class="md:hidden">
          <BreadcrumbLink as-child>
            <NuxtLink to="/">
              <LogoLetter class="size-4" :font-controlled="false" />
            </NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator class="md:hidden" />
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <NuxtLink to="/">Wholesale</NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="currentParent" />
        <BreadcrumbItem
          v-if="currentParent && typeof currentParent === 'object'"
        >
          <BreadcrumbLink as-child>
            <NuxtLink :to="currentParent.link">
              {{ currentParent.title }}
            </NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{{ currentTitle }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <!--  <div class="relative ml-5 w-full max-w-96 items-center">
       <Input
        id="search"
        type="text"
        :placeholder="$t('global_search_placeholder')"
        class="bg-input pl-10"
      />
      <span
        class="absolute inset-y-0 start-0 flex items-center justify-center px-2"
      >
        <LucideSearch class="size-5 text-foreground" />
      </span>
    </div>
   <div class="ml-auto mr-5">
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
