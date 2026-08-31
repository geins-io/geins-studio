import { describe, it, expect } from 'vitest';
import { mimeToAssetType } from '../asset';

describe('mimeToAssetType', () => {
  it.each([
    ['image/svg+xml', 'svg'],
    ['image/png', 'image'],
    ['image/jpeg', 'image'],
    ['image/webp', 'image'],
    // Non-renderable "image/*" formats must not become previewable images.
    ['image/vnd.adobe.photoshop', 'other'],
    ['image/x-photoshop', 'other'],
    ['image/tiff', 'other'],
    ['application/pdf', 'pdf'],
    ['video/mp4', 'video'],
    ['audio/mpeg', 'audio'],
    ['text/plain', 'doc'],
    ['application/msword', 'doc'],
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc',
    ],
    ['application/vnd.ms-excel', 'doc'],
    ['application/octet-stream', 'other'],
    ['', 'other'],
  ])('maps %s → %s', (mime, expected) => {
    expect(mimeToAssetType(mime)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(mimeToAssetType('IMAGE/PNG')).toBe('image');
    expect(mimeToAssetType('Image/SVG+XML')).toBe('svg');
  });

  it('prefers svg over the generic image/ prefix', () => {
    expect(mimeToAssetType('image/svg+xml')).toBe('svg');
  });
});
