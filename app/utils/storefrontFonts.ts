export interface StorefrontFont {
  label: string;
  value: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace';
}

export const storefrontFonts: StorefrontFont[] = [
  // Modern sans
  { label: 'Inter', value: 'Inter', category: 'sans-serif' },
  { label: 'Geist', value: 'Geist', category: 'sans-serif' },
  { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans', category: 'sans-serif' },
  { label: 'DM Sans', value: 'DM Sans', category: 'sans-serif' },
  { label: 'Work Sans', value: 'Work Sans', category: 'sans-serif' },
  { label: 'Outfit', value: 'Outfit', category: 'sans-serif' },
  { label: 'Space Grotesk', value: 'Space Grotesk', category: 'sans-serif' },

  // Classic sans
  { label: 'Roboto', value: 'Roboto', category: 'sans-serif' },
  { label: 'Open Sans', value: 'Open Sans', category: 'sans-serif' },
  { label: 'Lato', value: 'Lato', category: 'sans-serif' },
  { label: 'Montserrat', value: 'Montserrat', category: 'sans-serif' },
  { label: 'Poppins', value: 'Poppins', category: 'sans-serif' },
  { label: 'Raleway', value: 'Raleway', category: 'sans-serif' },
  { label: 'Nunito', value: 'Nunito', category: 'sans-serif' },
  { label: 'Source Sans 3', value: 'Source Sans 3', category: 'sans-serif' },

  // Serif
  { label: 'Hanuman', value: 'Hanuman', category: 'serif' },
  { label: 'Playfair Display', value: 'Playfair Display', category: 'serif' },
  { label: 'Merriweather', value: 'Merriweather', category: 'serif' },
  { label: 'Lora', value: 'Lora', category: 'serif' },
  { label: 'PT Serif', value: 'PT Serif', category: 'serif' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond', category: 'serif' },
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

/** Characters needed to render all font names in the preview subset */
const subsetText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789+-';

/** Single Google Fonts CSS URL loading all curated fonts as lightweight subsets */
export const storefrontFontsCssUrl = (() => {
  const families = storefrontFonts
    .map((f) => `family=${f.value.replace(/ /g, '+')}`)
    .join('&');
  const text = encodeURIComponent(subsetText);
  return `https://fonts.googleapis.com/css2?${families}&text=${text}&display=swap`;
})();

/** Get the CSS fallback stack for a font category */
export function fontFallback(category: StorefrontFont['category']): string {
  switch (category) {
    case 'serif':
      return 'serif';
    case 'monospace':
      return 'monospace';
    default:
      return 'sans-serif';
  }
}
