/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Brand } from '#shared/types';

const componentPath = resolve(
  __dirname,
  '..',
  'BrandSelector.vue',
);

describe('BrandSelector.vue', () => {
  it('should exist', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  const content = readFileSync(componentPath, 'utf-8');

  describe('Component Structure', () => {
    it('should have script setup with TypeScript', () => {
      expect(content).toContain('<script setup lang="ts">');
    });

    it('should define Props interface with brands and disableTeleport', () => {
      expect(content).toContain('interface Props');
      expect(content).toContain('brands: Brand[]');
      expect(content).toContain('disableTeleport?: boolean');
    });

    it('should import Brand type from shared types', () => {
      expect(content).toContain("import type { Brand } from '#shared/types'");
    });

    it('should define model with number or undefined', () => {
      expect(content).toContain('defineModel<number | undefined>()');
    });

    it('should use withDefaults for props', () => {
      expect(content).toContain('withDefaults(defineProps<Props>()');
      expect(content).toContain('disableTeleport: false');
    });
  });

  describe('Composables', () => {
    it('should use useI18n composable', () => {
      expect(content).toContain('const { t } = useI18n()');
    });
  });

  describe('Data Transformation', () => {
    it('should transform brands to dataSet with label and value', () => {
      expect(content).toContain('const dataSet = computed(() => {');
      expect(content).toContain('props.brands.map(brand => ({');
      expect(content).toContain('label: brand.name');
      expect(content).toContain('value: String(brand._id)');
    });

    it('should have findItem function to find brand by ID', () => {
      expect(content).toContain('const findItem = (value: number | undefined)');
      expect(content).toContain('if (value === undefined) return undefined');
      expect(content).toContain('dataSet.value.find(item => item.value === String(value))');
    });

    it('should initialize choice with findItem', () => {
      expect(content).toContain('const choice = ref');
      expect(content).toContain('findItem(model.value)');
    });
  });

  describe('State Management', () => {
    it('should have open ref for dropdown state', () => {
      expect(content).toContain('const open = ref(false)');
    });

    it('should have trigger ref for button element', () => {
      expect(content).toContain('const trigger = ref<HTMLElement | null>(null)');
    });

    it('should have searchInput ref', () => {
      expect(content).toContain('const searchInput = ref<HTMLElement | null>(null)');
    });

    it('should have comboboxList ref', () => {
      expect(content).toContain('const comboboxList = ref<HTMLElement | null>(null)');
    });

    it('should have isComingFromSearchInput flag', () => {
      expect(content).toContain('const isComingFromSearchInput = ref(false)');
    });

    it('should have wasOpenBeforeClick flag', () => {
      expect(content).toContain('const wasOpenBeforeClick = ref(false)');
    });
  });

  describe('Watchers', () => {
    it('should watch choice and emit update:modelValue', () => {
      expect(content).toContain('watch(choice, (newChoice) => {');
      expect(content).toContain('const newValue = newChoice ? Number(newChoice.value) : undefined');
      expect(content).toContain('if (newValue === model.value)');
      expect(content).toContain('model.value = newValue');
      expect(content).toContain('open.value = false');
    });

    it('should watch model and brands to sync choice', () => {
      expect(content).toContain('watch([model, () => props.brands]');
      expect(content).toContain('choice.value = findItem(newModelValue)');
    });
  });

  describe('Event Handlers', () => {
    it('should have handleFocus event handler', () => {
      expect(content).toContain('const handleFocus = async (event: FocusEvent)');
      expect(content).toContain('if (isComingFromSearchInput.value)');
      expect(content).toContain('open.value = true');
    });

    it('should have handleBlur event handler', () => {
      expect(content).toContain('const handleBlur = (event: FocusEvent)');
      expect(content).toContain('open.value = false');
    });

    it('should have handlePointerDown event handler', () => {
      expect(content).toContain('const handlePointerDown = (event: PointerEvent)');
      expect(content).toContain('event.preventDefault()');
      expect(content).toContain('open.value = !open.value');
    });

    it('should have handleKeyDown event handler', () => {
      expect(content).toContain('const handleKeyDown = ()');
      expect(content).toContain('open.value = !open.value');
    });
  });

  describe('Template Structure', () => {
    it('should use Combobox component with v-model', () => {
      expect(content).toContain('<Combobox v-model="choice" v-model:open="open" by="label">');
    });

    it('should use ComboboxAnchor with button trigger', () => {
      expect(content).toContain('<ComboboxAnchor');
      expect(content).toContain('ref="trigger"');
      expect(content).toContain('type="button"');
    });

    it('should display selected brand name or placeholder', () => {
      expect(content).toContain("{{ choice?.label ?? t('select_brand') }}");
    });

    it('should have ChevronsUpDown icon in trigger button', () => {
      expect(content).toContain('<LucideChevronsUpDown');
    });

    it('should attach event handlers to trigger button', () => {
      expect(content).toContain('@focus.prevent="handleFocus"');
      expect(content).toContain('@pointerdown.prevent="handlePointerDown"');
      expect(content).toContain('@keydown.enter.prevent="handleKeyDown"');
    });
  });

  describe('Dropdown Content', () => {
    it('should use ComboboxPortal with disableTeleport prop', () => {
      expect(content).toContain('<ComboboxPortal to="body" :disabled="disableTeleport">');
    });

    it('should use ComboboxList with position based on disableTeleport', () => {
      expect(content).toContain('<ComboboxList');
      expect(content).toContain('ref="comboboxList"');
      expect(content).toContain(":position=\"disableTeleport ? 'inline' : 'popper'\"");
    });

    it('should have ComboboxInput with search functionality', () => {
      expect(content).toContain('<ComboboxInput');
      expect(content).toContain('ref="searchInput"');
      expect(content).toContain(":placeholder=\"$t('search_brand') + '...'\"");
      expect(content).toContain('autocomplete="off"');
      expect(content).toContain('@blur="handleBlur"');
    });

    it('should have search icon', () => {
      expect(content).toContain('<LucideSearch');
    });

    it('should have ComboboxEmpty for no results state', () => {
      expect(content).toContain('<ComboboxEmpty>');
      expect(content).toContain("{{ $t('no_results') }}");
    });
  });

  describe('Brand Options', () => {
    it('should use ComboboxGroup for brand list', () => {
      expect(content).toContain('<ComboboxGroup class="max-h-75 overflow-auto">');
    });

    it('should render ComboboxItem for each brand in dataSet', () => {
      expect(content).toContain('<ComboboxItem v-for="item in dataSet"');
      expect(content).toContain(':key="item.value"');
      expect(content).toContain(':value="item"');
    });

    it('should display brand label in ComboboxItem', () => {
      expect(content).toContain('{{ item.label }}');
    });

    it('should have ComboboxItemIndicator with check icon', () => {
      expect(content).toContain('<ComboboxItemIndicator>');
      expect(content).toContain('<LucideCheck');
    });
  });

  describe('Styling', () => {
    it('should have proper styling classes on ComboboxAnchor', () => {
      expect(content).toContain('bg-input');
      expect(content).toContain('data-[state=open]:border-primary');
      expect(content).toContain('rounded-lg border');
    });

    it('should have focus styles on trigger button', () => {
      expect(content).toContain('focus:border-primary');
      expect(content).toContain('focus-visible:border-primary');
    });

    it('should have sticky search header', () => {
      expect(content).toContain('sticky top-0 z-50');
      expect(content).toContain('bg-card');
    });
  });
});

describe('BrandSelector i18n keys', () => {
  const enPath = resolve(__dirname, '../../../../i18n/locales/en.json');
  const svPath = resolve(__dirname, '../../../../i18n/locales/sv.json');

  it('should have search_brand key in en.json', () => {
    expect(existsSync(enPath)).toBe(true);
    const enContent = readFileSync(enPath, 'utf-8');
    expect(enContent).toContain('"search_brand"');
  });

  it('should have search_brand key in sv.json', () => {
    expect(existsSync(svPath)).toBe(true);
    const svContent = readFileSync(svPath, 'utf-8');
    expect(svContent).toContain('"search_brand"');
  });

  it('should have select_brand key in en.json (used for placeholder)', () => {
    const enContent = readFileSync(enPath, 'utf-8');
    expect(enContent).toContain('"select_brand"');
  });

  it('should have select_brand key in sv.json (used for placeholder)', () => {
    const svContent = readFileSync(svPath, 'utf-8');
    expect(svContent).toContain('"select_brand"');
  });

  it('should have no_results key in en.json', () => {
    const enContent = readFileSync(enPath, 'utf-8');
    expect(enContent).toContain('"no_results"');
  });

  it('should have no_results key in sv.json', () => {
    const svContent = readFileSync(svPath, 'utf-8');
    expect(svContent).toContain('"no_results"');
  });
});

describe('BrandSelector Type Safety', () => {
  const content = readFileSync(componentPath, 'utf-8');

  it('should convert brand _id to string for dataSet value', () => {
    expect(content).toContain('value: String(brand._id)');
  });

  it('should convert dataSet value back to number for model', () => {
    expect(content).toContain('const newValue = newChoice ? Number(newChoice.value) : undefined');
  });

  it('should handle undefined model value', () => {
    expect(content).toContain('if (value === undefined) return undefined');
  });

  it('should properly type event handlers', () => {
    expect(content).toContain('handleFocus = async (event: FocusEvent)');
    expect(content).toContain('handleBlur = (event: FocusEvent)');
    expect(content).toContain('handlePointerDown = (event: PointerEvent)');
  });
});

describe('BrandSelector Integration', () => {
  it('should be importable from pim components', () => {
    // Component should exist at the expected path
    expect(existsSync(componentPath)).toBe(true);
  });

  it('should accept Brand[] type from shared types', () => {
    const content = readFileSync(componentPath, 'utf-8');
    expect(content).toContain('brands: Brand[]');
  });

  it('should emit number type for brand ID', () => {
    const content = readFileSync(componentPath, 'utf-8');
    expect(content).toContain('defineModel<number | undefined>()');
  });
});
