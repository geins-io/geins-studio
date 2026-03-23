import { vi } from 'vitest';

export function createToastMock() {
  const toast = vi.fn();
  return { toast, useToast: vi.fn(() => ({ toast })) };
}
