// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  calculateContrast,
  getContrastWarning,
  WCAG_AA_NORMAL,
} from '../contrast';

describe('hexToRgb', () => {
  it('parses 6-char hex with #', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#0E7490')).toEqual([14, 116, 144]);
  });

  it('parses 6-char hex without #', () => {
    expect(hexToRgb('0E7490')).toEqual([14, 116, 144]);
  });

  it('expands 3-char shorthand', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000')).toEqual([0, 0, 0]);
    expect(hexToRgb('abc')).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb('#12')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
    expect(hexToRgb('not-hex')).toBeNull();
    expect(hexToRgb('#GGGGGG')).toBeNull();
    expect(hexToRgb('#xyz')).toBeNull();
  });
});

describe('calculateContrast', () => {
  it('returns 21 for black on white', () => {
    expect(calculateContrast('#000000', '#FFFFFF')).toBe(21);
  });

  it('is symmetric', () => {
    expect(calculateContrast('#FFFFFF', '#000000')).toBe(21);
  });

  it('returns ratio > AA threshold for cyan/white pair', () => {
    const ratio = calculateContrast('#0E7490', '#FFFFFF');
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
  });

  it('returns ratio below AA threshold for green/white pair', () => {
    const ratio = calculateContrast('#36d97c', '#FFFFFF');
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeLessThan(WCAG_AA_NORMAL);
  });

  it('returns null when either hex is invalid', () => {
    expect(calculateContrast('#fff', '#12')).toBeNull();
    expect(calculateContrast('not-hex', '#000')).toBeNull();
    expect(calculateContrast('', '')).toBeNull();
  });
});

describe('getContrastWarning', () => {
  it('returns null when ratio passes AA', () => {
    expect(getContrastWarning('#000000', '#FFFFFF')).toBeNull();
    expect(getContrastWarning('#0E7490', '#FFFFFF')).toBeNull();
  });

  it('returns { ratio } when ratio fails AA', () => {
    const warning = getContrastWarning('#36d97c', '#FFFFFF');
    expect(warning).not.toBeNull();
    expect(warning!.ratio).toBeLessThan(WCAG_AA_NORMAL);
  });

  it('returns null for invalid hex (neutral state)', () => {
    expect(getContrastWarning('#12', '#fff')).toBeNull();
    expect(getContrastWarning('', '')).toBeNull();
  });
});
