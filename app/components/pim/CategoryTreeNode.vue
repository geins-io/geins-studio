<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import type { CategoryTree } from '#shared/types';
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
        class="hover:bg-muted/50 flex items-center rounded-md transition-colors"
        :style="indentStyle"
      >
        <CollapsibleTrigger class="flex flex-1 items-center gap-2 px-2 py-2">
          <ChevronRight v-if="!isOpen" class="text-muted-foreground h-4 w-4" />
          <ChevronDown v-else class="text-muted-foreground h-4 w-4" />
          <span
            class="hover:text-primary cursor-pointer text-sm"
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
      class="hover:bg-muted/50 flex cursor-pointer items-center rounded-md px-2 py-2 transition-colors"
      :style="indentStyle"
      @click="handleClick"
    >
      <span class="hover:text-primary pl-6 text-sm">
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
