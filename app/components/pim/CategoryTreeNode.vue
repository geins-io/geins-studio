<script setup lang="ts">
import type { CategoryTree } from '#shared/types';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components';

interface Props {
  category: CategoryTree;
  level: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [categoryId: string];
}>();

const isOpen = ref(false);

const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0;
});

const indentStyle = computed(() => {
  return {
    paddingLeft: `${props.level * 1.5}rem`,
  };
});

function handleClick() {
  emit('select', props.category._id);
}

function handleChildSelect(categoryId: string) {
  emit('select', categoryId);
}
</script>

<template>
  <div class="category-tree-node">
    <Collapsible v-if="hasChildren" v-model:open="isOpen" class="w-full">
      <div
        class="flex items-center hover:bg-muted/50 rounded-md transition-colors"
        :style="indentStyle"
      >
        <CollapsibleTrigger class="flex items-center gap-2 py-2 px-2 flex-1">
          <ChevronRight v-if="!isOpen" class="h-4 w-4 text-muted-foreground" />
          <ChevronDown v-else class="h-4 w-4 text-muted-foreground" />
          <span
            class="text-sm cursor-pointer hover:text-primary"
            @click.stop="handleClick"
          >
            {{ category.name }}
          </span>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent>
        <CategoryTreeNode
          v-for="child in category.children"
          :key="child._id"
          :category="child"
          :level="level + 1"
          @select="handleChildSelect"
        />
      </CollapsibleContent>
    </Collapsible>

    <div
      v-else
      class="flex items-center py-2 px-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
      :style="indentStyle"
      @click="handleClick"
    >
      <span class="pl-6 text-sm hover:text-primary">
        {{ category.name }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.category-tree-node {
  @apply w-full;
}
</style>
