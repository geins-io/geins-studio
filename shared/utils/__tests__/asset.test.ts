import { describe, it, expect } from 'vitest';
import {
  assetCapabilities,
  assetListOptions,
  folderIdForSelection,
  ROOT_FOLDER_KEY,
  TRASH_KEY,
  assetPreviewUrl,
  contentTypeForUpload,
  mimeToAssetType,
  parseProductRef,
} from '../asset';

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

describe('assetCapabilities', () => {
  it('reports only the features phase 1 does not serve yet', () => {
    expect(assetCapabilities()).toEqual({
      // Phase-1 folder delete is empty-only (409 FOLDER_NOT_EMPTY) — no
      // disposition to choose.
      canDeleteFolderWithAssets: false,
      canEditTags: false,
      canEditChannels: false,
      canReplaceFile: false,
      tagAutocomplete: false,
      hasThumbnails: false,
    });
  });
});

describe('parseProductRef', () => {
  it.each([
    ['9963010083_hero-banner.jpg', '9963010083'],
    ['42_packshot.png', '42'],
    ['9963010083_size-guide.docx', '9963010083'], // non-image names still parse
    ['C-228_feature2.jpg', 'C-228'], // alphanumeric refs (article numbers / ids)
    ['IND-1042_photo.jpg', 'IND-1042'],
  ])('parses the ref before the first underscore from %s', (name, ref) => {
    expect(parseProductRef(name)).toBe(ref);
  });

  it.each([
    ['brand-logo.svg'], // no underscore
    ['9963010083-hero.jpg'], // separator must be an underscore, not a hyphen
    ['_leading-underscore.jpg'], // nothing before the underscore
    ['9963010083.jpg'], // no underscore at all
    [''],
  ])('returns null for %s', (name) => {
    expect(parseProductRef(name)).toBeNull();
  });
});

describe('contentTypeForUpload', () => {
  it('uses the browser-provided type when present', () => {
    expect(contentTypeForUpload('a.bin', 'image/png')).toBe('image/png');
  });

  it('derives from the extension when the browser gives none', () => {
    expect(contentTypeForUpload('logo.svg')).toBe('image/svg+xml');
    expect(contentTypeForUpload('clip.MP4')).toBe('video/mp4');
  });

  it('falls back to octet-stream for an unknown extension', () => {
    expect(contentTypeForUpload('data.xyz')).toBe('application/octet-stream');
  });
});

describe('assetPreviewUrl', () => {
  it('prefers the thumbnail when the backend serves one', () => {
    expect(assetPreviewUrl('image', '/thumb.jpg', '/full.jpg')).toBe(
      '/thumb.jpg',
    );
  });

  it('falls back to the full file for renderable types (phase-1 has no thumbs)', () => {
    expect(assetPreviewUrl('image', '', '/full.jpg')).toBe('/full.jpg');
    expect(assetPreviewUrl('svg', null, '/logo.svg')).toBe('/logo.svg');
  });

  it('never previews a type an <img> cannot render', () => {
    expect(assetPreviewUrl('pdf', '', '/doc.pdf')).toBeNull();
    expect(assetPreviewUrl('video', null, '/clip.mp4')).toBeNull();
  });

  it('returns null when there is nothing to show', () => {
    expect(assetPreviewUrl('image', '', '')).toBeNull();
    expect(assetPreviewUrl('image')).toBeNull();
  });
});

describe('assetListOptions', () => {
  it('sends no folder scope for All assets', () => {
    expect(assetListOptions(null)).toBeUndefined();
  });

  it('scopes to the library root for Uncategorised', () => {
    // Distinct from `undefined` — the repo turns this into `folderIds: [null]`.
    expect(assetListOptions(ROOT_FOLDER_KEY)).toEqual({ folderId: null });
  });

  it('scopes to a folder id', () => {
    expect(assetListOptions('fld-1')).toEqual({ folderId: 'fld-1' });
  });

  it('asks for the trashed set instead of a folder scope', () => {
    expect(assetListOptions(TRASH_KEY)).toEqual({ trashed: true });
  });
});

describe('folderIdForSelection', () => {
  it.each([
    [null, null],
    [ROOT_FOLDER_KEY, null],
    [TRASH_KEY, null],
    ['fld-1', 'fld-1'],
  ])('maps %s to %s', (selected, expected) => {
    expect(folderIdForSelection(selected)).toBe(expected);
  });
});
