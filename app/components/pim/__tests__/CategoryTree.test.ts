/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const componentPath = resolve(
  __dirname,
  '../CategoryTree.vue',
);
const componentNodePath = resolve(
  __dirname,
  '../CategoryTreeNode.vue',
);
const enLocalePath = resolve(__dirname, '../../../../i18n/locales/en.json');
const svLocalePath = resolve(__dirname, '../../../../i18n/locales/sv.json');

const componentContent = readFileSync(componentPath, 'utf-8');
const componentNodeContent = readFileSync(componentNodePath, 'utf-8');
const enLocale = JSON.parse(readFileSync(enLocalePath, 'utf-8'));
const svLocale = JSON.parse(readFileSync(svLocalePath, 'utf-8'));

describe('CategoryTree.vue', () => {
  describe('Component Structure', () => {
    it('should have script setup with TypeScript', () => {
      expect(componentContent).toContain('<script setup lang="ts">');
    });

    it('should import Category and CategoryTree types', () => {
      expect(componentContent).toContain("import type { Category, CategoryTree } from '#shared/types'");
    });

    it('should import chevron icons from lucide-vue-next', () => {
      expect(componentContent).toContain("import { ChevronDown, ChevronRight } from 'lucide-vue-next'");
    });
  });

  describe('Props Interface', () => {
    it('should define Props interface with categories array', () => {
      expect(componentContent).toContain('interface Props {');
      expect(componentContent).toContain('categories: Category[]');
    });

    it('should use defineProps with Props interface', () => {
      expect(componentContent).toContain('const props = defineProps<Props>()');
    });
  });

  describe('Emits', () => {
    it('should define select emit with categoryId parameter', () => {
      expect(componentContent).toContain('const emit = defineEmits<{');
      expect(componentContent).toContain('select: [categoryId: string]');
    });
  });

  describe('Tree Building Logic', () => {
    it('should have categoryTree computed property', () => {
      expect(componentContent).toContain('const categoryTree = computed<CategoryTree[]>');
    });

    it('should handle empty categories array', () => {
      expect(componentContent).toContain('if (!props.categories || props.categories.length === 0)');
      expect(componentContent).toContain('return []');
    });

    it('should create a Map for quick category lookup', () => {
      expect(componentContent).toContain('const categoryMap = new Map<string, CategoryTree>()');
    });

    it('should initialize all categories in the map with children array', () => {
      expect(componentContent).toContain('props.categories.forEach((category) => {');
      expect(componentContent).toContain('categoryMap.set(category._id, {');
      expect(componentContent).toContain('...category,');
      expect(componentContent).toContain('children: [],');
    });

    it('should identify root categories (no parent or parentCategoryId === 0)', () => {
      expect(componentContent).toContain('if (!category.parentCategoryId || category.parentCategoryId === 0)');
      expect(componentContent).toContain('rootCategories.push(treeNode)');
    });

    it('should add child categories to parent children array', () => {
      expect(componentContent).toContain('const parent = categoryMap.get(String(category.parentCategoryId))');
      expect(componentContent).toContain('parent.children.push(treeNode)');
    });

    it('should treat categories without found parent as root', () => {
      expect(componentContent).toMatch(/else[\s\S]*?rootCategories\.push\(treeNode\)/);
    });
  });

  describe('Event Handling', () => {
    it('should have handleCategoryClick function', () => {
      expect(componentContent).toContain('function handleCategoryClick(categoryId: string)');
    });

    it('should emit select event with categoryId', () => {
      expect(componentContent).toContain("emit('select', categoryId)");
    });
  });

  describe('Template', () => {
    it('should have root div with category-tree class', () => {
      expect(componentContent).toContain('<div class="category-tree">');
    });

    it('should show empty state when no categories', () => {
      expect(componentContent).toContain('v-if="categoryTree.length === 0"');
      expect(componentContent).toContain('text-muted-foreground text-sm');
      expect(componentContent).toContain("{{ $t('no_categories_available') }}");
    });

    it('should render CategoryTreeNode for each root category', () => {
      expect(componentContent).toContain('<CategoryTreeNode');
      expect(componentContent).toContain('v-for="category in categoryTree"');
      expect(componentContent).toContain(':key="category._id"');
      expect(componentContent).toContain(':category="category"');
      expect(componentContent).toContain(':level="0"');
    });

    it('should pass select event from CategoryTreeNode to handleCategoryClick', () => {
      expect(componentContent).toContain('@select="handleCategoryClick"');
    });
  });

  describe('Styling', () => {
    it('should have scoped styles', () => {
      expect(componentContent).toContain('<style scoped>');
    });

    it('should apply full width to category-tree', () => {
      expect(componentContent).toContain('@apply w-full');
    });
  });
});

describe('CategoryTreeNode.vue', () => {
  describe('Component Structure', () => {
    it('should have script setup with TypeScript', () => {
      expect(componentNodeContent).toContain('<script setup lang="ts">');
    });

    it('should import CategoryTree type', () => {
      expect(componentNodeContent).toContain("import type { CategoryTree } from '#shared/types'");
    });

    it('should import chevron icons', () => {
      expect(componentNodeContent).toContain("import { ChevronDown, ChevronRight } from 'lucide-vue-next'");
    });

    it('should import Collapsible components', () => {
      expect(componentNodeContent).toContain('Collapsible,');
      expect(componentNodeContent).toContain('CollapsibleContent,');
      expect(componentNodeContent).toContain('CollapsibleTrigger,');
      expect(componentNodeContent).toContain("from '#components'");
    });
  });

  describe('Props Interface', () => {
    it('should define Props interface with category and level', () => {
      expect(componentNodeContent).toContain('interface Props {');
      expect(componentNodeContent).toContain('category: CategoryTree');
      expect(componentNodeContent).toContain('level: number');
    });

    it('should use defineProps with Props interface', () => {
      expect(componentNodeContent).toContain('const props = defineProps<Props>()');
    });
  });

  describe('Emits', () => {
    it('should define select emit with categoryId parameter', () => {
      expect(componentNodeContent).toContain('const emit = defineEmits<{');
      expect(componentNodeContent).toContain('select: [categoryId: string]');
    });
  });

  describe('Component State', () => {
    it('should have isOpen ref for collapsible state', () => {
      expect(componentNodeContent).toContain('const isOpen = ref(false)');
    });

    it('should have hasChildren computed property', () => {
      expect(componentNodeContent).toContain('const hasChildren = computed(');
      expect(componentNodeContent).toContain('props.category.children');
      expect(componentNodeContent).toContain('.length > 0');
    });

    it('should have indentStyle computed property for hierarchy', () => {
      expect(componentNodeContent).toContain('const indentStyle = computed(');
      expect(componentNodeContent).toContain('paddingLeft');
      expect(componentNodeContent).toContain('props.level');
    });
  });

  describe('Event Handling', () => {
    it('should have handleClick function', () => {
      expect(componentNodeContent).toContain('function handleClick()');
      expect(componentNodeContent).toContain("emit('select', props.category._id)");
    });

    it('should have handleChildSelect function to propagate events', () => {
      expect(componentNodeContent).toContain('function handleChildSelect(categoryId: string)');
      expect(componentNodeContent).toContain("emit('select', categoryId)");
    });
  });

  describe('Template - Parent Categories', () => {
    it('should use Collapsible for categories with children', () => {
      expect(componentNodeContent).toContain('<Collapsible v-if="hasChildren"');
      expect(componentNodeContent).toContain('v-model:open="isOpen"');
    });

    it('should apply indentStyle to parent category container', () => {
      expect(componentNodeContent).toContain(':style="indentStyle"');
    });

    it('should have CollapsibleTrigger for expanding/collapsing', () => {
      expect(componentNodeContent).toContain('<CollapsibleTrigger');
    });

    it('should show ChevronRight when collapsed', () => {
      expect(componentNodeContent).toContain('<ChevronRight v-if="!isOpen"');
      expect(componentNodeContent).toContain('class="h-4 w-4 text-muted-foreground"');
    });

    it('should show ChevronDown when expanded', () => {
      expect(componentNodeContent).toContain('<ChevronDown v-else');
      expect(componentNodeContent).toContain('class="h-4 w-4 text-muted-foreground"');
    });

    it('should display category name with click handler', () => {
      expect(componentNodeContent).toContain('{{ category.name }}');
      expect(componentNodeContent).toContain('@click.stop="handleClick"');
    });

    it('should have hover styles on category name', () => {
      expect(componentNodeContent).toContain('hover:text-primary');
    });
  });

  describe('Template - Recursive Rendering', () => {
    it('should have CollapsibleContent for children', () => {
      expect(componentNodeContent).toContain('<CollapsibleContent>');
    });

    it('should recursively render CategoryTreeNode for each child', () => {
      expect(componentNodeContent).toContain('<CategoryTreeNode');
      expect(componentNodeContent).toContain('v-for="child in category.children"');
      expect(componentNodeContent).toContain(':key="child._id"');
      expect(componentNodeContent).toContain(':category="child"');
    });

    it('should increment level for children', () => {
      expect(componentNodeContent).toContain(':level="level + 1"');
    });

    it('should propagate select event from children', () => {
      expect(componentNodeContent).toContain('@select="handleChildSelect"');
    });
  });

  describe('Template - Leaf Categories', () => {
    it('should render leaf categories without Collapsible', () => {
      expect(componentNodeContent).toContain('<div\n      v-else');
      expect(componentNodeContent).toMatch(/v-else[\s\S]*?@click="handleClick"/);
    });

    it('should apply indentStyle to leaf categories', () => {
      expect(componentNodeContent).toMatch(/v-else[\s\S]*?:style="indentStyle"/);
    });

    it('should add extra left padding to leaf categories', () => {
      expect(componentNodeContent).toMatch(/v-else[\s\S]*?class="pl-6/);
    });

    it('should have hover styles on leaf categories', () => {
      expect(componentNodeContent).toMatch(/v-else[\s\S]*?hover:bg-muted\/50/);
      expect(componentNodeContent).toMatch(/v-else[\s\S]*?hover:text-primary/);
    });
  });

  describe('Styling', () => {
    it('should have scoped styles', () => {
      expect(componentNodeContent).toContain('<style scoped>');
    });

    it('should apply full width to category-tree-node', () => {
      expect(componentNodeContent).toContain('@apply w-full');
    });
  });
});

describe('i18n Keys', () => {
  describe('English Locale', () => {
    it('should have no_categories_available key in en.json', () => {
      expect(enLocale.no_categories_available).toBe('No categories available');
    });
  });

  describe('Swedish Locale', () => {
    it('should have no_categories_available key in sv.json', () => {
      expect(svLocale.no_categories_available).toBe('Inga kategorier tillgängliga');
    });
  });
});
