/**
 * Composable that creates a custom Blockly theme matching shadcn dark/light mode.
 *
 * Category colour mapping (Tailwind palette):
 *   - emerald-500  (#10b981) → data blocks
 *   - amber-500    (#f59e0b) → logic blocks
 *   - blue-500     (#3b82f6) → math blocks
 *   - pink-500     (#ec4899) → array blocks
 *   - violet-500   (#8b5cf6) → string blocks
 *   - cyan-500     (#06b6d4) → datetime blocks
 *   - indigo-500   (#6366f1) → conversion blocks
 *   - gray-500     (#6b7280) → other/default blocks
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlocklyModule = any;

const MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** HSL background values matching shadcn CSS custom properties */
const BG_DARK = '#0a0a0b'; // hsl(240 10% 3.9%)
const BG_LIGHT = '#ffffff'; // hsl(0 0% 100%)

const CATEGORY_COLOURS: Record<string, string> = {
  data: '#10b981',
  logic: '#f59e0b',
  math: '#3b82f6',
  array: '#ec4899',
  string: '#8b5cf6',
  datetime: '#06b6d4',
  conversion: '#6366f1',
  object: '#14b8a6', // teal-500
  other: '#6b7280',
};

export interface BlocklyThemeReturnType {
  createShadcnBlocklyTheme: (
    Blockly: BlocklyModule,
    isDark: boolean,
  ) => unknown;
  categoryColours: Record<string, string>;
}

export function useBlocklyTheme(): BlocklyThemeReturnType {
  function createShadcnBlocklyTheme(Blockly: BlocklyModule, isDark: boolean) {
    const bg = isDark ? BG_DARK : BG_LIGHT;
    const toolboxBg = isDark ? '#111113' : '#f9fafb';
    const textColor = isDark ? '#fafafa' : '#09090b';

    return Blockly.Theme.defineTheme('shadcn', {
      name: 'shadcn',
      base: Blockly.Themes.Classic,
      blockStyles: {
        data_blocks: {
          colourPrimary: CATEGORY_COLOURS.data,
          colourSecondary: '#059669',
          colourTertiary: '#047857',
        },
        logic_blocks: {
          colourPrimary: CATEGORY_COLOURS.logic,
          colourSecondary: '#d97706',
          colourTertiary: '#b45309',
        },
        math_blocks: {
          colourPrimary: CATEGORY_COLOURS.math,
          colourSecondary: '#2563eb',
          colourTertiary: '#1d4ed8',
        },
        array_blocks: {
          colourPrimary: CATEGORY_COLOURS.array,
          colourSecondary: '#db2777',
          colourTertiary: '#be185d',
        },
        string_blocks: {
          colourPrimary: CATEGORY_COLOURS.string,
          colourSecondary: '#7c3aed',
          colourTertiary: '#6d28d9',
        },
        datetime_blocks: {
          colourPrimary: CATEGORY_COLOURS.datetime,
          colourSecondary: '#0891b2',
          colourTertiary: '#0e7490',
        },
        conversion_blocks: {
          colourPrimary: CATEGORY_COLOURS.conversion,
          colourSecondary: '#4f46e5',
          colourTertiary: '#4338ca',
        },
        object_blocks: {
          colourPrimary: CATEGORY_COLOURS.object,
          colourSecondary: '#0d9488',
          colourTertiary: '#0f766e',
        },
        default_blocks: {
          colourPrimary: CATEGORY_COLOURS.other,
          colourSecondary: '#4b5563',
          colourTertiary: '#374151',
        },
      },
      categoryStyles: {
        data_category: { colour: CATEGORY_COLOURS.data },
        logic_category: { colour: CATEGORY_COLOURS.logic },
        math_category: { colour: CATEGORY_COLOURS.math },
        array_category: { colour: CATEGORY_COLOURS.array },
        string_category: { colour: CATEGORY_COLOURS.string },
        datetime_category: { colour: CATEGORY_COLOURS.datetime },
        conversion_category: { colour: CATEGORY_COLOURS.conversion },
        object_category: { colour: CATEGORY_COLOURS.object },
        other_category: { colour: CATEGORY_COLOURS.other },
      },
      componentStyles: {
        workspaceBackgroundColour: bg,
        toolboxBackgroundColour: toolboxBg,
        toolboxForegroundColour: textColor,
        flyoutBackgroundColour: isDark ? '#18181b' : '#f4f4f5',
        flyoutForegroundColour: textColor,
        flyoutOpacity: 1,
        scrollbarColour: isDark ? '#3f3f46' : '#d4d4d8',
        scrollbarOpacity: 0.6,
        insertionMarkerColour: CATEGORY_COLOURS.data,
        insertionMarkerOpacity: 0.4,
        cursorColour: CATEGORY_COLOURS.data,
      },
      fontStyle: {
        family: MONO_FONT,
        weight: '500',
        size: 13,
      },
      startHats: false,
    });
  }

  return {
    createShadcnBlocklyTheme,
    categoryColours: CATEGORY_COLOURS,
  };
}
