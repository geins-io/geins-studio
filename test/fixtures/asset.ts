import type { Asset, Folder } from '#shared/types';
import { nextId } from './ids';

export function buildAsset(overrides?: Partial<Asset>): Asset {
  return {
    _id: nextId('as'),
    _type: 'geins.asset',
    name: 'hero-spring.jpg',
    type: 'image',
    folderId: null,
    path: 'hero-spring.jpg',
    folderPath: null,
    description: null,
    localizations: {},
    altText: null,
    tags: [],
    channels: [],
    sizeBytes: 2_400_000,
    mime: 'image/jpeg',
    url: 'https://cdn.example.com/hero-spring.jpg',
    thumbUrl: 'https://cdn.example.com/hero-spring-thumb.jpg',
    createdBy: 'olivia',
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
    ...overrides,
  };
}

export function buildFolder(overrides?: Partial<Folder>): Folder {
  return {
    _id: nextId('fld'),
    _type: 'folder',
    name: 'Marketing',
    parentFolderId: null,
    system: false,
    sortOrder: 0,
    fullPath: 'Marketing',
    depth: 1,
    createdAt: '2026-08-17T00:00:00.000Z',
    ...overrides,
  };
}
