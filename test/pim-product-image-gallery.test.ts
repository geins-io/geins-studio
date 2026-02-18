/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ProductImageGallery Component', () => {
  const componentPath = join(
    process.cwd(),
    'app/components/pim/ProductImageGallery.vue',
  );

  it('should have ProductImageGallery.vue file', () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  describe('Component Structure', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should have script setup with TypeScript', () => {
      expect(content).toContain('<script setup lang="ts">');
    });

    it('should define Props interface with media and loading', () => {
      expect(content).toContain('interface Props');
      expect(content).toContain('media?: Media[]');
      expect(content).toContain('loading?: boolean');
    });

    it('should import Media type from shared types', () => {
      expect(content).toContain("import type { Media } from '#shared/types'");
    });

    it('should import LucideImage icon', () => {
      expect(content).toContain('LucideImage');
    });
  });

  describe('Composables Usage', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should use useI18n composable', () => {
      expect(content).toContain('useI18n()');
    });

    it('should use useGeinsImage composable', () => {
      expect(content).toContain('useGeinsImage()');
      expect(content).toContain('getProductThumbnail');
    });
  });

  describe('Computed Properties', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should have hasImages computed property', () => {
      expect(content).toContain('const hasImages = computed');
      expect(content).toContain('props.media');
      expect(content).toContain('length > 0');
    });

    it('should have sortedImages computed property', () => {
      expect(content).toContain('const sortedImages = computed');
      expect(content).toMatch(/sort.*order/s);
    });
  });

  describe('Image URL Helper', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should have getImageUrl function', () => {
      expect(content).toContain('const getImageUrl');
      expect(content).toContain('getProductThumbnail');
      expect(content).toContain('image.filename');
    });
  });

  describe('Template Structure', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should have loading state with Skeleton components', () => {
      expect(content).toContain('v-if="loading"');
      expect(content).toContain('<Skeleton');
      expect(content).toMatch(/grid.*cols-2.*sm:grid-cols-3.*md:grid-cols-4/s);
    });

    it('should have empty state when no images', () => {
      expect(content).toContain('v-else-if="!hasImages"');
      expect(content).toContain('LucideImage');
      expect(content).toContain("$t('product_no_images')");
    });

    it('should render image grid with responsive columns', () => {
      expect(content).toContain('v-else');
      expect(content).toContain('grid');
      expect(content).toMatch(/grid-cols-2.*gap-4.*sm:grid-cols-3.*md:grid-cols-4/s);
    });

    it('should loop through sortedImages', () => {
      expect(content).toContain('v-for="(image, index) in sortedImages"');
      expect(content).toContain(':key="image._id || index"');
    });

    it('should render image with proper attributes', () => {
      expect(content).toContain('<img');
      expect(content).toContain(':src="getImageUrl(image)"');
      expect(content).toContain(':alt="`Product image ${index + 1}`"');
    });

    it('should show Primary badge on first image', () => {
      expect(content).toContain('<Badge');
      expect(content).toContain('v-if="index === 0"');
      expect(content).toContain('variant="secondary"');
      expect(content).toContain("$t('primary')");
    });

    it('should have aspect-square and object-cover for images', () => {
      expect(content).toContain('aspect-square');
      expect(content).toContain('object-cover');
    });

    it('should have hover effect on images', () => {
      expect(content).toContain('group-hover:scale-105');
    });
  });

  describe('Styling Classes', () => {
    const content = readFileSync(componentPath, 'utf-8');

    it('should use proper spacing classes', () => {
      expect(content).toContain('space-y-4');
      expect(content).toContain('gap-4');
    });

    it('should have rounded corners on images', () => {
      expect(content).toContain('rounded-lg');
    });

    it('should position Primary badge absolutely', () => {
      expect(content).toContain('absolute');
      expect(content).toContain('left-2');
      expect(content).toContain('top-2');
    });
  });
});

describe('Product Detail Page - Images Tab Integration', () => {
  const pagePath = join(
    process.cwd(),
    'app/pages/pim/product/[id].vue',
  );

  it('should have product detail page', () => {
    expect(existsSync(pagePath)).toBe(true);
  });

  describe('Images Tab', () => {
    const content = readFileSync(pagePath, 'utf-8');

    it('should have Images tab at index 4', () => {
      expect(content).toContain('v-if="currentTab === 4"');
    });

    it('should render ProductImageGallery component in Images tab', () => {
      expect(content).toContain('<ProductImageGallery');
    });

    it('should pass media prop to ProductImageGallery', () => {
      expect(content).toMatch(/<ProductImageGallery[^>]*:media="entityData\?\.media \|\| \[\]"/s);
    });

    it('should pass loading prop to ProductImageGallery', () => {
      expect(content).toMatch(/<ProductImageGallery[^>]*:loading="loading"/s);
    });

    it('should use ContentEditCard for Images tab', () => {
      const imagesTabSection = content.match(
        /v-if="currentTab === 4"[\s\S]*?<\/KeepAlive>/,
      );
      expect(imagesTabSection).toBeTruthy();
      if (imagesTabSection) {
        expect(imagesTabSection[0]).toContain('<ContentEditCard');
        expect(imagesTabSection[0]).toContain("$t('images')");
        expect(imagesTabSection[0]).toContain("$t('product_images_description')");
      }
    });

    it('should wrap Images tab in KeepAlive', () => {
      const imagesTabMatch = content.match(
        /<KeepAlive>[\s\S]*?v-if="currentTab === 4"[\s\S]*?<\/KeepAlive>/,
      );
      expect(imagesTabMatch).toBeTruthy();
    });

    it('should not have images_content_placeholder in Images tab', () => {
      const imagesTabSection = content.match(
        /v-if="currentTab === 4"[\s\S]*?<\/ContentEditMainContent>/,
      );
      expect(imagesTabSection).toBeTruthy();
      if (imagesTabSection) {
        expect(imagesTabSection[0]).not.toContain('images_content_placeholder');
      }
    });
  });
});

describe('i18n Keys for Product Images', () => {
  const enPath = join(process.cwd(), 'i18n/locales/en.json');
  const svPath = join(process.cwd(), 'i18n/locales/sv.json');

  it('should have i18n files', () => {
    expect(existsSync(enPath)).toBe(true);
    expect(existsSync(svPath)).toBe(true);
  });

  describe('English Locale', () => {
    const enContent = readFileSync(enPath, 'utf-8');
    const enJson = JSON.parse(enContent);

    it('should have product_no_images key', () => {
      expect(enJson).toHaveProperty('product_no_images');
      expect(enJson.product_no_images).toBe('No images found for this product');
    });

    it('should have primary key', () => {
      expect(enJson).toHaveProperty('primary');
      expect(enJson.primary).toBe('Primary');
    });

    it('should have product_images_description key', () => {
      expect(enJson).toHaveProperty('product_images_description');
      expect(typeof enJson.product_images_description).toBe('string');
    });

    it('should have images key', () => {
      expect(enJson).toHaveProperty('images');
      expect(typeof enJson.images).toBe('string');
    });

    it('should not have images_content_placeholder referenced in component', () => {
      const componentPath = join(
        process.cwd(),
        'app/components/pim/ProductImageGallery.vue',
      );
      const componentContent = readFileSync(componentPath, 'utf-8');
      expect(componentContent).not.toContain('images_content_placeholder');
    });
  });

  describe('Swedish Locale', () => {
    const svContent = readFileSync(svPath, 'utf-8');
    const svJson = JSON.parse(svContent);

    it('should have product_no_images key', () => {
      expect(svJson).toHaveProperty('product_no_images');
      expect(svJson.product_no_images).toBe('Inga bilder hittades för denna produkt');
    });

    it('should have primary key', () => {
      expect(svJson).toHaveProperty('primary');
      expect(svJson.primary).toBe('Primär');
    });

    it('should have product_images_description key', () => {
      expect(svJson).toHaveProperty('product_images_description');
      expect(typeof svJson.product_images_description).toBe('string');
    });

    it('should have images key', () => {
      expect(svJson).toHaveProperty('images');
      expect(typeof svJson.images).toBe('string');
    });
  });
});
