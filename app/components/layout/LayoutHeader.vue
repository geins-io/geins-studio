<script setup lang="ts">
import LogoLetter from '@/assets/logos/geins-g.svg';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
const { state, toggleSidebar } = useSidebar();

useNavigation();

const breadcrumbsStore = useBreadcrumbsStore();
const { showBreadcrumbs, breadcrumbTrail } = storeToRefs(breadcrumbsStore);

const supportsHover = ref(true);
onMounted(() => {
  supportsHover.value = window.matchMedia(
    '(hover: hover) and (pointer: fine)',
  ).matches;
});
</script>
<template>
  <header
    v-auto-animate
    class="text-background-foreground bg-card flex flex-none items-center justify-start border-b"
  >
    <TooltipProvider :disabled="!supportsHover">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon"
            class="ml-2 size-7 flex-shrink-0 sm:ml-3"
            @click="toggleSidebar"
          >
            <LucidePanelLeftOpen
              v-if="state === 'collapsed'"
              class="text-muted-foreground size-4"
            />
            <LucidePanelLeftClose v-else class="text-muted-foreground size-4" />
            <span class="sr-only">Toggle Sidebar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent class="flex items-center gap-2">
          <p class="text-xs">Toggle Sidebar</p>
          <div class="flex gap-0.5">
            <div
              class="bg-background flex size-4.5 items-center justify-center rounded-md border text-xs"
            >
              ⌘
            </div>
            <div
              class="bg-background flex size-4.5 items-center justify-center rounded-md border text-xs"
            >
              G
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
        <BreadcrumbSeparator
          v-if="breadcrumbTrail.length > 0"
          class="md:hidden"
        />

        <!-- Render breadcrumb trail from navigation -->
        <template v-for="(item, index) in breadcrumbTrail" :key="index">
          <BreadcrumbSeparator v-if="index > 0" />
          <BreadcrumbItem>
            <!-- Last item is not a link -->
            <BreadcrumbPage v-if="index === breadcrumbTrail.length - 1">
              {{ item.label }}
            </BreadcrumbPage>
            <!-- Other items are links -->
            <BreadcrumbLink v-else as-child>
              <NuxtLink :to="item.href">
                {{ item.label }}
              </NuxtLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </template>
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
