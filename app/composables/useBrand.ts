type BrandId = 'geins' | 'litium';

interface UseBrandReturnType {
  brandId: ComputedRef<BrandId>;
  brandName: ComputedRef<string>;
  isLitium: ComputedRef<boolean>;
}

const _brandId = ref<BrandId | null>(null);

function detectBrand(): BrandId {
  const config = useRuntimeConfig();
  const override = config.public.brandOverride as string;
  if (override === 'litium') return 'litium';
  if (override === 'geins') return 'geins';

  if (import.meta.client) {
    const hostname = window.location.hostname;
    if (hostname === 'litium.studio' || hostname.endsWith('.litium.studio')) {
      return 'litium';
    }
  }

  return 'geins';
}

export const useBrand = (): UseBrandReturnType => {
  if (_brandId.value === null) {
    _brandId.value = detectBrand();
  }

  const brandId = computed(() => _brandId.value!);
  const brandName = computed(() =>
    _brandId.value === 'litium' ? 'Litium Studio' : 'Geins Studio',
  );
  const isLitium = computed(() => _brandId.value === 'litium');

  return { brandId, brandName, isLitium };
};
