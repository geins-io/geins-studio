// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  assetCapabilities,
  assetSelectionKind,
  bulkLinkCalls,
  normalizeAssetLabels,
  assetLabelLimitError,
  countAssetIds,
  sameAssetLabels,
  assetListOptions,
  bulkMoveErrorKey,
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
  uploadRejectionMessageKey,
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
      // The upload ticket doesn't take tags/channels yet.
      canUploadTagsAndChannels: false,
    });
  });
});

describe('normalizeAssetLabels', () => {
  it('trims, drops blanks and keeps the first of case-insensitive duplicates', () => {
    expect(
      normalizeAssetLabels([' Summer ', 'summer', '', '  ', 'SALE', 'Sale']),
    ).toEqual(['Summer', 'SALE']);
  });

  it('keeps order', () => {
    expect(normalizeAssetLabels(['b', 'a'])).toEqual(['b', 'a']);
  });
});

describe('assetLabelLimitError', () => {
  it('passes a list within the limits', () => {
    expect(assetLabelLimitError(['a', 'b'], 'tags')).toBeNull();
  });

  it('flags too many values after normalizing', () => {
    const many = Array.from({ length: 51 }, (_, i) => `c${i}`);
    expect(assetLabelLimitError(many, 'channels')).toBe('count');
    // Case-insensitive duplicates don't count twice.
    expect(
      assetLabelLimitError([...many.slice(0, 50), 'C0'], 'channels'),
    ).toBeNull();
  });

  it('flags a value over the max length', () => {
    expect(assetLabelLimitError(['x'.repeat(65)], 'tags')).toBe('length');
    expect(assetLabelLimitError([` ${'x'.repeat(64)} `], 'tags')).toBeNull();
  });
});

describe('countAssetIds', () => {
  it('counts distinct guids in a problem detail', () => {
    const a = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
    const b = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    expect(
      countAssetIds(`Would exceed the limit: ${a}, ${b}, ${a.toUpperCase()}`),
    ).toBe(2);
  });

  it('is 0 without ids', () => {
    expect(countAssetIds('Too many tags.')).toBe(0);
    expect(countAssetIds(undefined)).toBe(0);
  });
});

describe('sameAssetLabels', () => {
  it('ignores order', () => {
    expect(sameAssetLabels(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('detects added, removed and changed values', () => {
    expect(sameAssetLabels(['a'], ['a', 'b'])).toBe(false);
    expect(sameAssetLabels(['a', 'b'], ['a'])).toBe(false);
    expect(sameAssetLabels(['a'], ['A'])).toBe(false);
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

describe('uploadRejectionMessageKey', () => {
  it('maps a code to its friendly reason', () => {
    expect(uploadRejectionMessageKey('PATH_ALREADY_EXISTS')).toBe(
      'asset_library.upload_reject_path_already_exists',
    );
  });

  it('gives a path held by a trashed asset its own copy', () => {
    expect(uploadRejectionMessageKey('PATH_ALREADY_EXISTS', true)).toBe(
      'asset_library.upload_reject_path_in_trash',
    );
    // Only a path conflict can be "in the trash".
    expect(uploadRejectionMessageKey('FILE_TOO_LARGE', true)).toBe(
      'asset_library.upload_reject_file_too_large',
    );
  });
});

describe('assetPreviewUrl', () => {
  const cdn = 'https://cdn-qa.geins.media/acme/hero.jpg';

  it('adds the preset params for each surface', () => {
    expect(assetPreviewUrl('image', cdn, 'row')).toBe(
      `${cdn}?width=40&height=40&fit=crop&dpr=2`,
    );
    expect(assetPreviewUrl('image', cdn, 'card')).toBe(
      `${cdn}?width=420&height=280&fit=crop&dpr=2`,
    );
    expect(assetPreviewUrl('image', cdn, 'banner')).toBe(
      `${cdn}?width=500&height=250&fit=crop&dpr=2`,
    );
  });

  it('keeps the existing ?v= cache-buster', () => {
    expect(assetPreviewUrl('image', `${cdn}?v=abc123`, 'row')).toBe(
      `${cdn}?v=abc123&width=40&height=40&fit=crop&dpr=2`,
    );
  });

  it('leaves SVGs untouched (the optimizer serves them as-is)', () => {
    const svg = 'https://cdn-qa.geins.media/acme/logo.svg?v=1';
    expect(assetPreviewUrl('svg', svg, 'card')).toBe(svg);
  });

  it('returns a url it cannot parse unchanged', () => {
    expect(assetPreviewUrl('image', '/full.jpg', 'card')).toBe('/full.jpg');
  });

  it('never previews a type an <img> cannot render', () => {
    expect(assetPreviewUrl('pdf', 'https://cdn/doc.pdf', 'card')).toBeNull();
    expect(assetPreviewUrl('video', 'https://cdn/clip.mp4', 'row')).toBeNull();
  });

  it('returns null when there is no url', () => {
    expect(assetPreviewUrl('image', '', 'card')).toBeNull();
    expect(assetPreviewUrl('image', null, 'card')).toBeNull();
    expect(assetPreviewUrl('image', undefined, 'row')).toBeNull();
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

describe('bulkMoveErrorKey', () => {
  it('maps each bulk-move 409 by its problem title', () => {
    expect(
      bulkMoveErrorKey(409, 'A move of these assets is already in flight.'),
    ).toBe('bulk_move_in_flight');
    expect(bulkMoveErrorKey(409, 'Two listed assets share a name.')).toBe(
      'bulk_move_name_clash',
    );
    expect(
      bulkMoveErrorKey(409, 'Another asset already sits at the path.'),
    ).toBe('bulk_move_destination_taken');
    expect(bulkMoveErrorKey(409, 'An upload is still in flight.')).toBe(
      'bulk_move_pending',
    );
    expect(bulkMoveErrorKey(409, 'A move is still delivering a file.')).toBe(
      'bulk_move_pending',
    );
  });

  it('falls back to a generic conflict for an unknown 409 title', () => {
    expect(bulkMoveErrorKey(409, 'Entity already exists')).toBe(
      'bulk_move_conflict',
    );
    expect(bulkMoveErrorKey(409)).toBe('bulk_move_conflict');
  });

  it('maps 404 and 422, and leaves other statuses to the backend title', () => {
    expect(bulkMoveErrorKey(404)).toBe('bulk_move_not_found');
    expect(bulkMoveErrorKey(422)).toBe('bulk_move_path_too_long');
    expect(bulkMoveErrorKey(500, 'Server error')).toBeUndefined();
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

describe('assetSelectionKind', () => {
  it('is images when every asset is an image or svg', () => {
    expect(assetSelectionKind(['image', 'svg'])).toBe('images');
  });
  it('is files when none is', () => {
    expect(assetSelectionKind(['pdf', 'doc'])).toBe('files');
  });
  it('is mixed otherwise, counting an unknown type as a file', () => {
    expect(assetSelectionKind(['image', 'pdf'])).toBe('mixed');
    expect(assetSelectionKind(['image', undefined])).toBe('mixed');
  });
});

describe('bulkLinkCalls', () => {
  const types: Record<string, 'image' | 'svg' | 'pdf'> = {
    i1: 'image',
    i2: 'svg',
    f1: 'pdf',
  };
  const typeOf = (id: string) => types[id];

  it('splits images and files into one call each by type', () => {
    expect(
      bulkLinkCalls(['i1', 'f1', 'i2'], typeOf, 'byType', ['p1', 'p2']),
    ).toEqual([
      {
        assetIds: ['i1', 'i2'],
        links: [
          { targetType: 'productimage', targetId: 'p1' },
          { targetType: 'productimage', targetId: 'p2' },
        ],
      },
      {
        assetIds: ['f1'],
        links: [
          { targetType: 'productfile', targetId: 'p1' },
          { targetType: 'productfile', targetId: 'p2' },
        ],
      },
    ]);
  });

  it('links everything as a file in file mode', () => {
    const calls = bulkLinkCalls(['i1', 'f1'], typeOf, 'file', ['p1']);
    expect(calls).toEqual([
      {
        assetIds: ['i1', 'f1'],
        links: [{ targetType: 'productfile', targetId: 'p1' }],
      },
    ]);
  });

  it('links an asset of unknown type as a file', () => {
    const calls = bulkLinkCalls(['x'], typeOf, 'byType', ['p1']);
    expect(calls[0]!.links[0]!.targetType).toBe('productfile');
  });

  it('caps the links per call', () => {
    const products = Array.from({ length: 5 }, (_, i) => `p${i}`);
    const calls = bulkLinkCalls(['i1'], typeOf, 'byType', products, 2);
    expect(calls.map((c) => c.links.length)).toEqual([2, 2, 1]);
  });

  it('makes no calls without products', () => {
    expect(bulkLinkCalls(['i1'], typeOf, 'byType', [])).toEqual([]);
  });
});
