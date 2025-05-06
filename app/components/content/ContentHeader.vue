<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    showBreadcrumb?: boolean;
    entityName?: string;
  }>(),
  {
    title: '',
    description: '',
    showBreadcrumb: true,
    entityName: '',
  },
);
const route = useRoute();
const { getEntityListUrl } = useEntity(route.fullPath);
const listPageUrl = getEntityListUrl();
const tableMaximized = useState<boolean>('table-maximized');
// TODO: Dynamic breadcrumbs

const slots = useSlots();
const hasTabs = computed(() => !!slots.tabs);
const hasChanges = computed(() => !!slots.changes);
</script>

<template>
  <div
    :class="
      cn(
        'origin-top transform transition-[transform]',
        `${tableMaximized ? 'scale-y-0' : ''}`,
      )
    "
  >
    <Breadcrumb v-if="showBreadcrumb" class="mb-3">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as-child>
            <NuxtLink to="/">Home</NuxtLink>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem v-if="listPageUrl">
          <BreadcrumbLink as-child>
            <NuxtLink :to="listPageUrl">{{
              $t('entity_caps', { entityName }, 2)
            }}</NuxtLink>
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
          <BreadcrumbPage>{{ title }}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div
      :class="
        cn(
          'content-header mb-4 flex flex-wrap justify-between border-b',
          `${hasTabs || hasChanges ? 'pb-0' : 'pb-2'}`,
        )
      "
    >
      <slot name="title">
        <ContentTitleBlock :title="title" :description="description" />
      </slot>
      <slot />
      <div
        v-if="hasTabs || hasChanges"
        v-auto-animate
        class="mt-5 flex w-full justify-between"
      >
        <slot name="tabs" />
        <slot name="changes" />
      </div>
    </div>
  </div>
</template>
