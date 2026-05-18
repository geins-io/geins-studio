// WCAG 2.1 contrast ratio calculation.
// https://www.w3.org/TR/WCAG21/#contrast-minimum

export const WCAG_AA_NORMAL = 4.5;

export function hexToRgb(hex: string): [number, number, number] | null {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    if (!/^[0-9a-fA-F]{3}$/.test(h)) return null;
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (h.length === 6) {
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  } else {
    return null;
  }
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function calculateContrast(
  hex1: string,
  hex2: string,
): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export function getContrastWarning(
  bgHex: string,
  fgHex: string,
): { ratio: number } | null {
  const ratio = calculateContrast(bgHex, fgHex);
  if (ratio === null || ratio >= WCAG_AA_NORMAL) return null;
  return { ratio };
}
