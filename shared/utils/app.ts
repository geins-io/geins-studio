export function resolveAppId(
  configOverride?: string,
  hostname?: string,
): string {
  if (configOverride) return configOverride;
  if (hostname) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 2]!;
      if (!/^\d+$/.test(candidate)) return candidate;
    }
  }
  return 'geins';
}
