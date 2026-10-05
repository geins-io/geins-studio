import { describe, it, expect } from 'vitest';
import {
  assetCapabilities,
  assetListOptions,
  folderIdForSelection,
  ROOT_FOLDER_KEY,
  TRASH_KEY,
  assetPreviewUrl,
  contentTypeForUpload,
  isProductLink,
  isReplaceExtensionAllowed,
  mimeToAssetType,
  parseProductRef,
  productLinkTargetType,
  replaceErrorMessageKey,
  replaceExtensions,
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
      tagAutocomplete: false,
      hasThumbnails: false,
    });
  });
});

describe('productLinkTargetType', () => {
  it('links image + svg as productimage and everything else as productfile', () => {
    expect(productLinkTargetType('image')).toBe('productimage');
    expect(productLinkTargetType('svg')).toBe('productimage');
    expect(productLinkTargetType('pdf')).toBe('productfile');
    expect(productLinkTargetType('other')).toBe('productfile');
  });
});

describe('isProductLink', () => {
  it('accepts both product link kinds and rejects anything else', () => {
    expect(isProductLink('productimage')).toBe(true);
    expect(isProductLink('productfile')).toBe(true);
    expect(isProductLink('product')).toBe(false);
    expect(isProductLink('category')).toBe(false);
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

describe('replaceExtensions', () => {
  it("returns the asset's own extension, plus aliases for the same type", () => {
    expect(replaceExtensions('hero.png')).toEqual(['.png']);
    expect(replaceExtensions('hero.JPEG')).toEqual(['.jpg', '.jpeg']);
    expect(replaceExtensions('scan.tif')).toEqual(['.tif', '.tiff']);
    expect(replaceExtensions('archive.tar.gz')).toEqual(['.gz']);
  });

  it('is empty when the asset name has no extension', () => {
    expect(replaceExtensions('README')).toEqual([]);
    expect(replaceExtensions('.env')).toEqual([]);
  });
});

describe('isReplaceExtensionAllowed', () => {
  it('accepts the same extension or an alias, case-insensitively', () => {
    expect(isReplaceExtensionAllowed('hero.jpg', 'new.jpg')).toBe(true);
    expect(isReplaceExtensionAllowed('hero.jpeg', 'new.JPG')).toBe(true);
  });

  it('refuses a different type', () => {
    expect(isReplaceExtensionAllowed('hero.jpg', 'new.png')).toBe(false);
    expect(isReplaceExtensionAllowed('hero.jpg', 'new')).toBe(false);
  });

  it('leaves extensionless assets to the backend', () => {
    expect(isReplaceExtensionAllowed('README', 'new.png')).toBe(true);
  });
});

describe('replaceErrorMessageKey', () => {
  it.each([
    [404, 'asset_library.replace_error_not_found'],
    [409, 'asset_library.upload_reject_path_move_pending'],
    [422, 'asset_library.replace_error_invalid_file'],
    [500, 'asset_library.upload_reject_generic'],
  ])('maps %i → %s', (status, key) => {
    expect(replaceErrorMessageKey(status)).toBe(key);
  });
});
