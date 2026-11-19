const FONT_CATEGORIES = [
  'sans-serif',
  'serif',
  'display',
  'handwriting',
  'monospace',
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number];

export interface StorefrontFont {
  label: string;
  value: string;
  category: FontCategory;
}

/** Curated quick picks, shown as suggestions above the full catalogue. */
export const storefrontFonts: StorefrontFont[] = [
  // Modern sans
  { label: 'Inter', value: 'Inter', category: 'sans-serif' },
  { label: 'Geist', value: 'Geist', category: 'sans-serif' },
  {
    label: 'Plus Jakarta Sans',
    value: 'Plus Jakarta Sans',
    category: 'sans-serif',
  },
  { label: 'DM Sans', value: 'DM Sans', category: 'sans-serif' },
  { label: 'Work Sans', value: 'Work Sans', category: 'sans-serif' },
  { label: 'Outfit', value: 'Outfit', category: 'sans-serif' },
  { label: 'Space Grotesk', value: 'Space Grotesk', category: 'sans-serif' },
  { label: 'Host Grotesk', value: 'Host Grotesk', category: 'sans-serif' },
  { label: 'Spline Sans', value: 'Spline Sans', category: 'sans-serif' },

  // Classic sans
  { label: 'Roboto', value: 'Roboto', category: 'sans-serif' },
  { label: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
  { label: 'Lato', value: 'Lato', category: 'sans-serif' },
  { label: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
  { label: 'Poppins', value: 'Poppins', category: 'sans-serif' },
  { label: 'Raleway', value: 'Raleway', category: 'sans-serif' },
  { label: 'Nunito', value: 'Nunito', category: 'sans-serif' },
  { label: 'Source Sans 3', value: 'Source Sans 3', category: 'sans-serif' },
  { label: 'Mukta', value: 'Mukta', category: 'sans-serif' },

  // Serif
  { label: 'Hanuman', value: 'Hanuman', category: 'serif' },
  { label: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
  { label: 'Merriweather', value: 'Merriweather', category: 'serif' },
  { label: 'Lora', value: 'Lora', category: 'serif' },
  { label: 'PT Serif', value: 'PT Serif', category: 'serif' },
  {
    label: 'Cormorant Garamond',
    value: 'Cormorant Garamond',
    category: 'serif',
  },
  { label: 'EB Garamond', value: 'EB Garamond', category: 'serif' },

  // Display
  { label: 'Syne', value: 'Syne', category: 'display' },
  { label: 'Josefin Sans', value: 'Josefin Sans', category: 'display' },
  { label: 'Bebas Neue', value: 'Bebas Neue', category: 'display' },
  { label: 'Oswald', value: 'Oswald', category: 'display' },

  // Monospace
  { label: 'Geist Mono', value: 'Geist Mono', category: 'monospace' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono', category: 'monospace' },
  { label: 'Source Code Pro', value: 'Source Code Pro', category: 'monospace' },
];

/** Characters needed to render every catalogue font name in its preview. */
const subsetText =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789+-';

const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2';

function familyParam(family: string): string {
  return `family=${encodeURIComponent(family).replace(/%20/g, '+')}`;
}

function previewCssUrl(families: string[]): string {
  const params = families.map(familyParam).join('&');
  const text = encodeURIComponent(subsetText);
  return `${GOOGLE_FONTS_CSS_URL}?${params}&text=${text}&display=swap`;
}

/**
 * One Google Fonts CSS URL loading a lightweight subset of each family — just
 * enough glyphs to preview the font names. Every family must exist on Google
 * Fonts: a single unknown one fails the whole stylesheet.
 */
export function fontPreviewCssUrl(families: string[]): string | null {
  return families.length ? previewCssUrl(families) : null;
}

/** Preview stylesheet for the curated fonts. */
export const storefrontFontsCssUrl = previewCssUrl(
  storefrontFonts.map((f) => f.value),
);

/**
 * Full Google Fonts CSS URL for a font family, or `null` when blank. The
 * picker only offers Google Fonts families, so any picked value resolves.
 */
export function fontToGoogleUrl(fontFamily: string): string | null {
  const family = fontFamily.trim();
  if (!family) return null;
  return `${GOOGLE_FONTS_CSS_URL}?${familyParam(family)}&display=swap`;
}

/** Get the CSS fallback stack for a font category */
export function fontFallback(category: FontCategory): string {
  switch (category) {
    case 'serif':
      return 'serif';
    case 'monospace':
      return 'monospace';
    case 'handwriting':
      return 'cursive';
    default:
      return 'sans-serif';
  }
}

function isFontCategory(value: string): value is FontCategory {
  return FONT_CATEGORIES.some((category) => category === value);
}

/** Maps raw catalogue entries to picker options; unknown categories → sans-serif. */
export function toStorefrontFonts(
  entries: { family: string; category: string }[],
): StorefrontFont[] {
  return entries.map(({ family, category }) => ({
    label: family,
    value: family,
    category: isFontCategory(category) ? category : 'sans-serif',
  }));
}

let googleFontsPromise: Promise<StorefrontFont[]> | undefined;

/**
 * The full Google Fonts catalogue (~2,000 families, most popular first),
 * loaded once on demand so it stays out of the main bundle. Refresh the
 * snapshot with `pnpm fonts:update`.
 */
export function loadGoogleFonts(): Promise<StorefrontFont[]> {
  googleFontsPromise ??= import('@/assets/google-fonts.json')
    .then((module) => toStorefrontFonts(module.default))
    .catch((error: unknown) => {
      googleFontsPromise = undefined;
      throw error;
    });
  return googleFontsPromise;
}

/**
 * Fonts whose name matches `query`, best matches first: names starting with
 * it, then names with a word starting with it, then any other match. Keeps
 * the input order (popularity) within each group.
 */
export function searchFonts(
  fonts: StorefrontFont[],
  query: string,
  limit = Infinity,
): StorefrontFont[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix: StorefrontFont[] = [];
  const wordStart: StorefrontFont[] = [];
  const contains: StorefrontFont[] = [];
  for (const font of fonts) {
    const name = font.label.toLowerCase();
    if (name.startsWith(q)) prefix.push(font);
    else if (name.includes(` ${q}`)) wordStart.push(font);
    else if (name.includes(q)) contains.push(font);
  }
  return [...prefix, ...wordStart, ...contains].slice(0, limit);
}
