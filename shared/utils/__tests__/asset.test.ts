import { describe, it, expect } from 'vitest';
import {
  assetCapabilities,
  assetEndpoints,
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
  it('enables every gated feature for the mock backend, except the real-only ones', () => {
    const caps = assetCapabilities('mock');
    expect(caps).toEqual({
      backend: 'mock',
      canEditDescriptionAltText: true,
      canEditTags: true,
      canEditChannels: true,
      canDeleteAsset: true,
      canDeleteFolderWithAssets: true,
      canReplaceFile: true,
      tagAutocomplete: true,
      hasThumbnails: true,
      // The mock hard-deletes, so there is nothing to restore.
      hasTrash: false,
      // The mock has no `{id}/links` route, so there is no usage to show.
      hasUsageLinks: false,
    });
  });

  it('reflects the shipped phase-1 surface for media-phase1', () => {
    const caps = assetCapabilities('media-phase1');
    expect(caps.backend).toBe('media-phase1');
    // PATCH (description/altText) + DELETE shipped in phase 1. Rename + move
    // ship too (POST …/relocate) — they carry no flag, so there is none to assert.
    expect(caps.canEditDescriptionAltText).toBe(true);
    expect(caps.canDeleteAsset).toBe(true);
    // Not in the phase-1 surface yet.
    expect(caps.canEditTags).toBe(false);
    expect(caps.canEditChannels).toBe(false);
    // Phase-1 folder delete is empty-only (409 FOLDER_NOT_EMPTY) — no disposition.
    expect(caps.canDeleteFolderWithAssets).toBe(false);
    expect(caps.canReplaceFile).toBe(false);
    expect(caps.tagAutocomplete).toBe(false);
    expect(caps.hasThumbnails).toBe(false);
    // DELETE is soft on Geins.Media — trash + restore is real-only.
    expect(caps.hasTrash).toBe(true);
    // `GET {id}/links` is real-only too.
    expect(caps.hasUsageLinks).toBe(true);
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

describe('assetEndpoints', () => {
  it('points media-phase1 at the real Geins.Media routes', () => {
    expect(assetEndpoints('media-phase1')).toEqual({
      asset: '/media/assets',
      folder: '/media/folders',
      // Real folders list at the collection root and are replaced with PUT.
      folderList: '/media/folders',
      folderUpdateMethod: 'PUT',
      // Tickets are a sibling of assets on the real API, not a child.
      tickets: '/media/tickets',
    });
  });

  it('overrides back to the mock routes', () => {
    expect(assetEndpoints('mock')).toEqual({
      asset: '/asset',
      folder: '/asset/folder',
      folderList: '/asset/folder/list',
      folderUpdateMethod: 'PATCH',
      tickets: '/asset/tickets',
    });
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
