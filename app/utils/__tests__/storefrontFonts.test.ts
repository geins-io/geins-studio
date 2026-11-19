// @vitest-environment node
import { describe, it, expect } from 'vitest';
import googleFonts from '../../assets/google-fonts.json';
import {
  fontFallback,
  fontPreviewCssUrl,
  fontToGoogleUrl,
  searchFonts,
  storefrontFonts,
  storefrontFontsCssUrl,
  toStorefrontFonts,
} from '../storefrontFonts';
import type { StorefrontFont } from '../storefrontFonts';

const font = (label: string): StorefrontFont => ({
  label,
  value: label,
  category: 'sans-serif',
});

describe('searchFonts', () => {
  const fonts = [
    'Open Sans',
    'Sansita',
    'Noto Sans',
    'Josefin Sans',
    'Lato',
  ].map(font);

  it('returns nothing for a blank query', () => {
    expect(searchFonts(fonts, '')).toEqual([]);
    expect(searchFonts(fonts, '   ')).toEqual([]);
  });

  it('ranks name prefix, then word start, then any match', () => {
    const labels = searchFonts(fonts, 'sans').map((f) => f.label);
    expect(labels).toEqual([
      'Sansita',
      'Open Sans',
      'Noto Sans',
      'Josefin Sans',
    ]);
  });

  it('keeps the input order within a rank and ignores case', () => {
    const labels = searchFonts(fonts, ' SANS ').map((f) => f.label);
    expect(labels.slice(1)).toEqual(['Open Sans', 'Noto Sans', 'Josefin Sans']);
  });

  it('matches inside a word last', () => {
    const labels = searchFonts([font('Plato'), font('Atomic Age')], 'ato').map(
      (f) => f.label,
    );
    expect(labels).toEqual(['Atomic Age', 'Plato']);
  });

  it('caps the results at the limit', () => {
    expect(searchFonts(fonts, 'sans', 2)).toHaveLength(2);
  });
});

describe('fontPreviewCssUrl', () => {
  it('returns null without families', () => {
    expect(fontPreviewCssUrl([])).toBeNull();
  });

  it('loads every family as a name-preview subset', () => {
    const url = fontPreviewCssUrl(['Open Sans', 'Lato'])!;
    expect(url).toMatch(
      /^https:\/\/fonts\.googleapis\.com\/css2\?family=Open\+Sans&family=Lato&text=/,
    );
    expect(url).toMatch(/&display=swap$/);
  });

  it('is what the curated preview stylesheet uses', () => {
    expect(storefrontFontsCssUrl).toBe(
      fontPreviewCssUrl(storefrontFonts.map((f) => f.value)),
    );
  });
});

describe('fontToGoogleUrl', () => {
  it('builds a URL for any family, curated or not', () => {
    expect(fontToGoogleUrl('Inter')).toBe(
      'https://fonts.googleapis.com/css2?family=Inter&display=swap',
    );
    expect(fontToGoogleUrl(' Dancing Script ')).toBe(
      'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap',
    );
  });

  it('returns null for a blank family', () => {
    expect(fontToGoogleUrl('')).toBeNull();
    expect(fontToGoogleUrl('  ')).toBeNull();
  });
});

describe('fontFallback', () => {
  it('falls back to cursive for handwriting fonts', () => {
    expect(fontFallback('handwriting')).toBe('cursive');
    expect(fontFallback('display')).toBe('sans-serif');
  });
});

describe('toStorefrontFonts', () => {
  it('maps unknown categories to sans-serif', () => {
    expect(
      toStorefrontFonts([
        { family: 'Caveat', category: 'handwriting' },
        { family: 'Mystery', category: 'blackletter' },
      ]),
    ).toEqual([
      { label: 'Caveat', value: 'Caveat', category: 'handwriting' },
      { label: 'Mystery', value: 'Mystery', category: 'sans-serif' },
    ]);
  });
});

describe('Google Fonts catalogue snapshot', () => {
  const families = googleFonts.map((f) => f.family);

  it('contains every curated font', () => {
    const missing = storefrontFonts
      .map((f) => f.value)
      .filter((value) => !families.includes(value));
    expect(missing).toEqual([]);
  });

  it('leaves out families without a regular (400) face', () => {
    // fontToGoogleUrl's bare family URL answers 400 Bad Request for these.
    const noRegular = ['Buda', 'Molle', 'Sunflower', 'UnifrakturCook'];
    expect(families.filter((f) => noRegular.includes(f))).toEqual([]);
  });

  it('lists each family once with a known category', () => {
    expect(new Set(families).size).toBe(families.length);
    const known = [
      'sans-serif',
      'serif',
      'display',
      'handwriting',
      'monospace',
    ];
    expect(googleFonts.filter((f) => !known.includes(f.category))).toEqual([]);
  });
});
