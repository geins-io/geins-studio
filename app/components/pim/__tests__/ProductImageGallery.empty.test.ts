import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Media } from '#shared/types';
import ProductImageGallery from '../ProductImageGallery.vue';

// Mock the composables
vi.mock('#app', async () => {
  const actual = await vi.importActual('#app') as Record<string, unknown>;
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          product_no_images: 'No images found',
          primary: 'Primary',
        };
        return translations[key] || key;
      },
    }),
  };
});

vi.mock('@/composables/useGeinsImage', () => ({
  useGeinsImage: () => ({
    getProductThumbnail: (filename: string) => `/images/${filename}`,
  }),
}));

describe('ProductImageGallery - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no images exist', () => {
    const wrapper = mount(ProductImageGallery, {
      props: {
        media: [],
        loading: false,
      },
      global: {
        stubs: {
          Empty: {
            template: '<div class="empty-state"><slot /></div>',
          },
          EmptyHeader: {
            template: '<div class="empty-header"><slot /></div>',
          },
          EmptyMedia: {
            template: '<div class="empty-media"><slot /></div>',
          },
          EmptyTitle: {
            template: '<div class="empty-title"><slot /></div>',
          },
          LucideImage: {
            template: '<svg class="lucide-image" />',
          },
          Skeleton: true,
          Badge: true,
        },
      },
    });

    // Check that empty state is rendered
    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.html()).toContain('product_no_images');
  });

  it('should show empty state icon', () => {
    const wrapper = mount(ProductImageGallery, {
      props: {
        media: [],
        loading: false,
      },
      global: {
        stubs: {
          Empty: {
            template: '<div class="empty-state"><slot /></div>',
          },
          EmptyHeader: {
            template: '<div class="empty-header"><slot /></div>',
          },
          EmptyMedia: {
            template: '<div class="empty-media"><slot /></div>',
          },
          EmptyTitle: {
            template: '<div class="empty-title"><slot /></div>',
          },
          LucideImage: {
            template: '<svg class="lucide-image" />',
          },
          Skeleton: true,
          Badge: true,
        },
      },
    });

    // Check that the image icon is rendered
    expect(wrapper.find('.lucide-image').exists()).toBe(true);
  });

  it('should not show empty state when images exist', () => {
    const mockMedia = [
      {
        _id: 1,
        _type: 'media',
        filename: 'test-image.jpg',
        order: 1,
        mediaId: 1,
      },
    ] as unknown as Media[];

    const wrapper = mount(ProductImageGallery, {
      props: {
        media: mockMedia,
        loading: false,
      },
      global: {
        stubs: {
          Empty: {
            template: '<div class="empty-state"><slot /></div>',
          },
          EmptyHeader: {
            template: '<div class="empty-header"><slot /></div>',
          },
          EmptyMedia: {
            template: '<div class="empty-media"><slot /></div>',
          },
          EmptyTitle: {
            template: '<div class="empty-title"><slot /></div>',
          },
          LucideImage: {
            template: '<svg class="lucide-image" />',
          },
          Skeleton: true,
          Badge: true,
        },
      },
    });

    // Empty state should not exist
    expect(wrapper.find('.empty-state').exists()).toBe(false);
  });

  it('should show loading state instead of empty state when loading', () => {
    const wrapper = mount(ProductImageGallery, {
      props: {
        media: [],
        loading: true,
      },
      global: {
        stubs: {
          Empty: {
            template: '<div class="empty-state"><slot /></div>',
          },
          EmptyHeader: {
            template: '<div class="empty-header"><slot /></div>',
          },
          EmptyMedia: {
            template: '<div class="empty-media"><slot /></div>',
          },
          EmptyTitle: {
            template: '<div class="empty-title"><slot /></div>',
          },
          LucideImage: {
            template: '<svg class="lucide-image" />',
          },
          Skeleton: true,
          Badge: true,
        },
      },
    });

    // Loading skeletons should be visible, not empty state
    expect(wrapper.find('.empty-state').exists()).toBe(false);
    // Check for skeleton elements
    const skeletons = wrapper.findAllComponents({ name: 'Skeleton' });
    expect(skeletons.length).toBe(4);
  });

  it('should show image grid when images exist', () => {
    const mockMedia = [
      {
        _id: 1,
        _type: 'media',
        filename: 'image1.jpg',
        order: 1,
        mediaId: 1,
      },
      {
        _id: 2,
        _type: 'media',
        filename: 'image2.jpg',
        order: 2,
        mediaId: 2,
      },
    ] as unknown as Media[];

    const wrapper = mount(ProductImageGallery, {
      props: {
        media: mockMedia,
        loading: false,
      },
      global: {
        stubs: {
          Empty: {
            template: '<div class="empty-state"><slot /></div>',
          },
          EmptyHeader: {
            template: '<div class="empty-header"><slot /></div>',
          },
          EmptyMedia: {
            template: '<div class="empty-media"><slot /></div>',
          },
          EmptyTitle: {
            template: '<div class="empty-title"><slot /></div>',
          },
          LucideImage: {
            template: '<svg class="lucide-image" />',
          },
          Skeleton: true,
          Badge: {
            template: '<span class="badge"><slot /></span>',
          },
        },
      },
    });

    // Check that images are rendered
    const images = wrapper.findAll('img');
    expect(images.length).toBe(2);
    expect(images[0]?.attributes('src')).toContain('image1.jpg');
    expect(images[1]?.attributes('src')).toContain('image2.jpg');
  });

  it('should mark first image as primary', () => {
    const mockMedia = [
      {
        _id: 1,
        _type: 'media',
        filename: 'image1.jpg',
        order: 1,
        mediaId: 1,
      },
      {
        _id: 2,
        _type: 'media',
        filename: 'image2.jpg',
        order: 2,
        mediaId: 2,
      },
    ] as unknown as Media[];

    const wrapper = mount(ProductImageGallery, {
      props: {
        media: mockMedia,
        loading: false,
      },
      global: {
        stubs: {
          Empty: true,
          EmptyHeader: true,
          EmptyMedia: true,
          EmptyTitle: true,
          LucideImage: true,
          Skeleton: true,
          Badge: {
            template: '<span class="badge"><slot /></span>',
          },
        },
      },
    });

    // Check that first image has primary badge
    const badges = wrapper.findAll('.badge');
    expect(badges.length).toBe(1);
    expect(badges[0]?.text()).toBe('primary');
  });

  it('should sort images by order property', () => {
    const mockMedia = [
      {
        _id: 3,
        _type: 'media',
        filename: 'image3.jpg',
        order: 3,
        mediaId: 3,
      },
      {
        _id: 1,
        _type: 'media',
        filename: 'image1.jpg',
        order: 1,
        mediaId: 1,
      },
      {
        _id: 2,
        _type: 'media',
        filename: 'image2.jpg',
        order: 2,
        mediaId: 2,
      },
    ] as unknown as Media[];

    const wrapper = mount(ProductImageGallery, {
      props: {
        media: mockMedia,
        loading: false,
      },
      global: {
        stubs: {
          Empty: true,
          EmptyHeader: true,
          EmptyMedia: true,
          EmptyTitle: true,
          LucideImage: true,
          Skeleton: true,
          Badge: true,
        },
      },
    });

    // Check that images are in correct order
    const images = wrapper.findAll('img');
    expect(images[0]?.attributes('src')).toContain('image1.jpg');
    expect(images[1]?.attributes('src')).toContain('image2.jpg');
    expect(images[2]?.attributes('src')).toContain('image3.jpg');
  });
});
