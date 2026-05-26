type BrandId = 'geins' | 'litium';

interface BrandConfig {
  id: BrandId;
  name: string;
  website: { url: string; label: string };
  favicon: string;
  hostnames: string[];
  logoFullMaxWidth?: string;
}

const brands: Record<BrandId, BrandConfig> = {
  geins: {
    id: 'geins',
    name: 'Geins Studio',
    website: { url: 'https://www.geins.io', label: 'geins.io' },
    favicon: '/favicon-geins.svg',
    hostnames: ['geins.studio'],
  },
  litium: {
    id: 'litium',
    name: 'Litium Studio',
    website: { url: 'https://www.litium.com', label: 'litium.com' },
    favicon: '/favicon-litium.svg',
    hostnames: ['litium.studio'],
    logoFullMaxWidth: '86px',
  },
};

const DEFAULT_BRAND: BrandId = 'geins';

interface UseBrandReturnType {
  brand: ComputedRef<BrandConfig>;
  brandId: ComputedRef<BrandId>;
  brandName: ComputedRef<string>;
}

const _brandId = ref<BrandId | null>(null);

function detectBrand(): BrandId {
  const config = useRuntimeConfig();
  const override = config.public.brandOverride as string;
  if (override in brands) return override as BrandId;

  if (import.meta.client) {
    const hostname = window.location.hostname;
    for (const [id, cfg] of Object.entries(brands)) {
      if (cfg.hostnames.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
        return id as BrandId;
      }
    }
  }

  return DEFAULT_BRAND;
}

export const useBrand = (): UseBrandReturnType => {
  if (_brandId.value === null) {
    _brandId.value = detectBrand();
  }

  const brandId = computed(() => _brandId.value!);
  const brand = computed(() => brands[_brandId.value!]);
  const brandName = computed(() => brand.value.name);

  return { brand, brandId, brandName };
};
