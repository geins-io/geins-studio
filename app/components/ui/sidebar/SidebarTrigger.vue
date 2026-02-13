<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/index';
import { useSidebar } from './utils';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <LucidePanelLeft />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
