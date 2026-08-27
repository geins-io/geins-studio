import type { AssetLocalizations, Localized } from '#shared/types';
import type { InjectionKey, Ref, ComputedRef } from 'vue';

/**
 * Per-file metadata the wizard collects before upload. Mirrors the editable
 * fields of an asset (name + folder + channels + description + tags + alt-text
 * localizations); everything is optional until the user fills it in. Steps
 * 2 (manage) and 3 (review) read and write this; step 1 only adds files.
 */
export interface WizardFileSettings {
  name?: string;
  folderId?: string | null;
  channels?: string[];
  description?: string;
  tags?: string[];
  /** Localized alt text (images only), keyed by locale. */
  localizations?: Localized<AssetLocalizations>;
}

/**
 * A selected file plus a stable id. A native `File` has no identity of its own,
 * so we mint one on add — the id keys the {@link WizardFileSettings} map and the
 * step-2 selection, and survives reordering / removal.
 */
export interface WizardFile {
  id: string;
  file: File;
}

interface UseUploadWizardReturnType {
  files: Ref<WizardFile[]>;
  settings: Ref<Record<string, WizardFileSettings>>;
  totalSize: ComputedRef<number>;
  addFiles: (list: FileList | File[] | null | undefined) => void;
  removeFiles: (ids: string[]) => void;
  clear: () => void;
  settingsOf: (id: string) => WizardFileSettings;
  patchSettings: (id: string, patch: Partial<WizardFileSettings>) => void;
}

/**
 * Working state for the multi-step upload wizard (`/asset-library/upload`).
 *
 * Holds the selected files (each wrapped as a {@link WizardFile}) and a per-file
 * settings map. Returns a fresh instance per call — the page owns one and shares
 * it with the step components via {@link uploadWizardKey} (provide) /
 * {@link useUploadWizardContext} (inject), so state resets when the page unmounts.
 */
export function useUploadWizard(): UseUploadWizardReturnType {
  const files = ref<WizardFile[]>([]);
  const settings = ref<Record<string, WizardFileSettings>>({});

  const totalSize = computed(() =>
    files.value.reduce((sum, f) => sum + f.file.size, 0),
  );

  function addFiles(list: FileList | File[] | null | undefined) {
    if (!list) return;
    const added = Array.from(list).map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));
    files.value = [...files.value, ...added];
  }

  function removeFiles(ids: string[]) {
    const drop = new Set(ids);
    files.value = files.value.filter((f) => !drop.has(f.id));
    settings.value = Object.fromEntries(
      Object.entries(settings.value).filter(([id]) => !drop.has(id)),
    );
  }

  function clear() {
    files.value = [];
    settings.value = {};
  }

  const settingsOf = (id: string): WizardFileSettings =>
    settings.value[id] ?? {};

  function patchSettings(id: string, patch: Partial<WizardFileSettings>) {
    settings.value[id] = { ...(settings.value[id] ?? {}), ...patch };
  }

  return {
    files,
    settings,
    totalSize,
    addFiles,
    removeFiles,
    clear,
    settingsOf,
    patchSettings,
  };
}

/** Provide/inject key so step components share the page's wizard instance. */
export const uploadWizardKey: InjectionKey<UseUploadWizardReturnType> =
  Symbol('uploadWizard');

/** Inject the wizard instance provided by the upload page. */
export function useUploadWizardContext(): UseUploadWizardReturnType {
  const wizard = inject(uploadWizardKey);
  if (!wizard) {
    throw new Error(
      'useUploadWizardContext must be used within the upload wizard page',
    );
  }
  return wizard;
}
