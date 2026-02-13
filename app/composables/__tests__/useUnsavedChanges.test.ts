// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const { mockNavigateTo, mockOnBeforeRouteLeave } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockOnBeforeRouteLeave: vi.fn(),
}));

vi.mock('../useGeinsLog', () => ({
  useGeinsLog: vi.fn(() => ({
    geinsLog: vi.fn(),
    geinsLogError: vi.fn(),
    geinsLogInfo: vi.fn(),
    geinsLogWarn: vi.fn(),
  })),
}));

vi.mock('#app/composables/router', () => ({
  navigateTo: mockNavigateTo,
}));

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: mockOnBeforeRouteLeave,
}));
import { useUnsavedChanges } from '../useUnsavedChanges';

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    mockNavigateTo.mockClear();
    mockOnBeforeRouteLeave.mockClear();
  });

  function setup(
    data: Record<string, unknown>,
    options?: {
      createMode?: boolean;
      excludeFields?: string[];
      externalChanges?: boolean;
    },
  ) {
    const currentData = ref({ ...data });
    const originalData = ref(JSON.stringify(data));
    const createMode = ref(options?.createMode ?? false);
    const externalChanges =
      options?.externalChanges !== undefined
        ? ref(options.externalChanges)
        : undefined;

    const result = useUnsavedChanges(
      currentData,
      originalData,
      createMode,
      options?.excludeFields,
      externalChanges,
    );

    return {
      currentData,
      originalData,
      createMode,
      externalChanges,
      ...result,
    };
  }

  describe('hasUnsavedChanges', () => {
    it('returns false when data matches original', () => {
      const { hasUnsavedChanges } = setup({ name: 'Test', value: 42 });
      expect(hasUnsavedChanges.value).toBe(false);
    });

    it('returns true when data differs from original', () => {
      const { hasUnsavedChanges, currentData } = setup({ name: 'Test' });
      currentData.value = { name: 'Changed' };
      expect(hasUnsavedChanges.value).toBe(true);
    });

    it('returns false in create mode regardless of data changes', () => {
      const { hasUnsavedChanges, currentData } = setup(
        { name: 'Test' },
        { createMode: true },
      );
      currentData.value = { name: 'Changed' };
      expect(hasUnsavedChanges.value).toBe(false);
    });

    it('excludes specified fields from comparison', () => {
      const { hasUnsavedChanges, currentData } = setup(
        { name: 'Test', updatedAt: '2024-01-01' },
        { excludeFields: ['updatedAt'] },
      );
      currentData.value = { name: 'Test', updatedAt: '2024-12-31' };
      expect(hasUnsavedChanges.value).toBe(false);
    });

    it('detects changes in non-excluded fields when excludeFields is set', () => {
      const { hasUnsavedChanges, currentData } = setup(
        { name: 'Test', updatedAt: '2024-01-01' },
        { excludeFields: ['updatedAt'] },
      );
      currentData.value = { name: 'Changed', updatedAt: '2024-01-01' };
      expect(hasUnsavedChanges.value).toBe(true);
    });

    it('returns true when externalChanges is true', () => {
      const { hasUnsavedChanges } = setup(
        { name: 'Test' },
        { externalChanges: true },
      );
      expect(hasUnsavedChanges.value).toBe(true);
    });

    it('returns false when externalChanges is false and data matches', () => {
      const { hasUnsavedChanges } = setup(
        { name: 'Test' },
        { externalChanges: false },
      );
      expect(hasUnsavedChanges.value).toBe(false);
    });

    it('returns true when externalChanges is true with excludeFields', () => {
      const { hasUnsavedChanges } = setup(
        { name: 'Test', meta: 'x' },
        { excludeFields: ['meta'], externalChanges: true },
      );
      expect(hasUnsavedChanges.value).toBe(true);
    });
  });

  describe('route leave guard', () => {
    it('registers onBeforeRouteLeave callback during setup', () => {
      setup({ name: 'Test' });
      expect(mockOnBeforeRouteLeave).toHaveBeenCalledOnce();
      expect(typeof mockOnBeforeRouteLeave.mock.calls[0][0]).toBe('function');
    });

    it('blocks navigation when there are unsaved changes', () => {
      const { currentData } = setup({ name: 'Test' });
      currentData.value = { name: 'Changed' };

      const guard = mockOnBeforeRouteLeave.mock.calls[0][0];
      const result = guard({ fullPath: '/other' });
      expect(result).toBe(false);
    });

    it('opens unsavedChangesDialogOpen when guard blocks', () => {
      const { currentData, unsavedChangesDialogOpen } = setup({ name: 'Test' });
      currentData.value = { name: 'Changed' };

      const guard = mockOnBeforeRouteLeave.mock.calls[0][0];
      guard({ fullPath: '/other' });
      expect(unsavedChangesDialogOpen.value).toBe(true);
    });

    it('allows navigation when there are no unsaved changes', () => {
      setup({ name: 'Test' });

      const guard = mockOnBeforeRouteLeave.mock.calls[0][0];
      const result = guard({ fullPath: '/other' });
      expect(result).toBe(true);
    });
  });

  describe('confirmLeave', () => {
    it('closes the dialog and navigates to pending route', () => {
      const { currentData, unsavedChangesDialogOpen, confirmLeave } = setup({
        name: 'Test',
      });
      currentData.value = { name: 'Changed' };

      // Trigger the guard to set leavingTo
      const guard = mockOnBeforeRouteLeave.mock.calls[0][0];
      guard({ fullPath: '/destination' });
      expect(unsavedChangesDialogOpen.value).toBe(true);

      confirmLeave();
      expect(unsavedChangesDialogOpen.value).toBe(false);
      expect(mockNavigateTo).toHaveBeenCalledWith('/destination');
    });

    it('does not navigate if no pending route', () => {
      const { confirmLeave } = setup({ name: 'Test' });
      confirmLeave();
      expect(mockNavigateTo).not.toHaveBeenCalled();
    });
  });
});
