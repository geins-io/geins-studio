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
  appId: ComputedRef<string>;
  favicon: ComputedRef<string>;
}

const _brandId = ref<BrandId | null>(null);
const _appId = ref<string | null>(null);

function detectBrand(): { brandId: BrandId; appId: string } {
  const config = useRuntimeConfig();
  const override = config.public.appId as string;

  if (override) {
    const brandId =
      override in brands ? (override as BrandId) : detectBrandFromHostname();
    return { brandId, appId: override };
  }

  const brandId = detectBrandFromHostname();
  return { brandId, appId: brandId };
}

function detectBrandFromHostname(): BrandId {
  if (import.meta.client) {
    const hostname = window.location.hostname;
    for (const [id, cfg] of Object.entries(brands)) {
      if (
        cfg.hostnames.some((h) => hostname === h || hostname.endsWith(`.${h}`))
      ) {
        return id as BrandId;
      }
    }
  }
  return DEFAULT_BRAND;
}

export const useBrand = (): UseBrandReturnType => {
  if (_brandId.value === null) {
    const detected = detectBrand();
    _brandId.value = detected.brandId;
    _appId.value = detected.appId;
  }

  const brandId = computed(() => _brandId.value!);
  const brand = computed(() => brands[_brandId.value!]);
  const brandName = computed(() => brand.value.name);
  const appId = computed(() => _appId.value!);
  const favicon = computed(() => `/favicon-${appId.value}.svg`);

  return { brand, brandId, brandName, appId, favicon };
};
