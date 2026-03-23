import { vi } from 'vitest';
import { ref } from 'vue';

export function createI18nMock(translations?: Record<string, string>) {
  const t = vi.fn((key: string) => translations?.[key] ?? key);
  const locale = ref('en');
  return { t, locale };
}
