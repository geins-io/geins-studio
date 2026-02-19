<script setup lang="ts">
import type { Category, CategoryTree } from '#shared/types';

interface Props {
  categories: Category[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [categoryId: string];
}>();

// Build hierarchical tree from flat categories array
const categoryTree = computed<CategoryTree[]>(() => {
  if (!props.categories || props.categories.length === 0) {
    return [];
  }

  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryTree>();
  
  // Initialize all categories in the map
  props.categories.forEach((category) => {
    categoryMap.set(category._id, {
      ...category,
      children: [],
    });
  });

  // Build the tree structure
  const rootCategories: CategoryTree[] = [];
  
  props.categories.forEach((category) => {
    const treeNode = categoryMap.get(category._id);
    if (!treeNode) return;

    if (!category.parentCategoryId || category.parentCategoryId === 0) {
      // Root category
      rootCategories.push(treeNode);
    } else {
      // Child category - add to parent
      const parent = categoryMap.get(String(category.parentCategoryId));
      if (parent) {
        parent.children.push(treeNode);
      } else {
        // Parent not found, treat as root
        rootCategories.push(treeNode);
      }
    }
  });

  return rootCategories;
});

function handleCategoryClick(categoryId: string) {
  emit('select', categoryId);
}
</script>

<template>
  <div class="category-tree">
    <div v-if="categoryTree.length === 0" class="text-muted-foreground p-4 text-sm">
      {{ $t('no_categories_available') }}
    </div>
    
    <CategoryTreeNode
      v-for="category in categoryTree"
      :key="category._id"
      :category="category"
      :level="0"
      @select="handleCategoryClick"
    />
  </div>
</template>

<style scoped>
.category-tree {
  @apply w-full;
}
</style>
