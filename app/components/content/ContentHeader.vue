<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    showBreadcrumb?: boolean;
  }>(),
  {
    title: '',
    description: '',
    showBreadcrumb: true,
  },
);
const tableMaximized = useState<boolean>('table-maximized');
// TODO: Dynamic breadcrumbs
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
      class="content-header mb-3 flex flex-wrap justify-between border-b pb-2"
    >
      <slot name="title">
        <ContentTitleBlock :title="title" :description="description" />
      </slot>
      <slot />
      <slot name="tabs" />
    </div>
  </div>
</template>
