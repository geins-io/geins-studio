/**
 * Composable that creates a custom Blockly theme matching shadcn dark/light mode.
 *
 * Blocks use the app's "status badge" treatment: the clear (vivid) category
 * colour is the block border (`colourTertiary`), and the fill (`colourPrimary`)
 * is that same colour at low opacity — precomputed as a solid blend over the
 * canvas background so the workspace grid doesn't bleed through a translucent
 * fill. Mirrors e.g. `border-emerald-500/30 bg-emerald-500/10` badges.
 *
 * Category colour mapping (Tailwind 500):
 *   - emerald (#10b981) → data       - amber  (#f59e0b) → logic
 *   - blue    (#3b82f6) → math       - pink   (#ec4899) → array
 *   - violet  (#8b5cf6) → string     - cyan   (#06b6d4) → datetime
 *   - indigo  (#6366f1) → conversion - teal   (#14b8a6) → object
 *   - gray    (#6b7280) → other/default
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlocklyModule = any;

const MONO_FONT =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** HSL background values matching shadcn CSS custom properties */
const BG_DARK = '#0a0a0b'; // hsl(240 10% 3.9%)
const BG_LIGHT = '#ffffff'; // hsl(0 0% 100%)

/** Clear category colours (Tailwind 500) — used directly as block borders. */
const CATEGORY_COLOURS = {
  data: '#10b981',
  logic: '#f59e0b',
  math: '#3b82f6',
  array: '#ec4899',
  string: '#8b5cf6',
  datetime: '#06b6d4',
  conversion: '#6366f1',
  object: '#14b8a6',
  other: '#6b7280',
} as const;

interface BadgeBand {
  /** Fill opacity for the block face (the `bg-{c}/10` step). */
  fillAlpha: number;
  /** Opacity for inner/shadow blocks — a touch stronger than the face. */
  innerAlpha: number;
}

/**
 * Phase-1 (STU-242) badge-style knobs. Tune these live; every block colour
 * derives from them, so a couple of numbers shift the whole set. Dark mode
 * needs a little more opacity for the tint to register on a near-black canvas.
 */
const PALETTE: Record<'light' | 'dark', BadgeBand> = {
  light: { fillAlpha: 0.1, innerAlpha: 0.18 },
  dark: { fillAlpha: 0.14, innerAlpha: 0.22 },
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend `hex` at `alpha` over `bg` → solid #rrggbb (the badge look on a surface). */
function mix(hex: string, alpha: number, bg: string): string {
  const [r, g, b] = hexToRgb(hex);
  const [br, bg_, bb] = hexToRgb(bg);
  const ch = (c: number, base: number) =>
    Math.round(c * alpha + base * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(r, br)}${ch(g, bg_)}${ch(b, bb)}`;
}

interface BlockStyle {
  colourPrimary: string;
  colourSecondary: string;
  colourTertiary: string;
}

function buildBlockStyle(
  vivid: string,
  band: BadgeBand,
  bg: string,
): BlockStyle {
  return {
    colourPrimary: mix(vivid, band.fillAlpha, bg),
    colourSecondary: mix(vivid, band.innerAlpha, bg),
    colourTertiary: vivid,
  };
}

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
    const band = isDark ? PALETTE.dark : PALETTE.light;

    const blockStyles: Record<string, BlockStyle> = {};
    const categoryStyles: Record<string, { colour: string }> = {};

    for (const [cat, vivid] of Object.entries(CATEGORY_COLOURS)) {
      const blockKey = cat === 'other' ? 'default_blocks' : `${cat}_blocks`;
      blockStyles[blockKey] = buildBlockStyle(vivid, band, bg);
      // Toolbox category bars keep the clear colour for recognition.
      categoryStyles[`${cat}_category`] = { colour: vivid };
    }

    return Blockly.Theme.defineTheme('shadcn', {
      name: 'shadcn',
      base: Blockly.Themes.Classic,
      blockStyles,
      categoryStyles,
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
