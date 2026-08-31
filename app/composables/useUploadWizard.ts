import type { LocalizedText } from '#shared/types';
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
  /** Localized alt text (images only): locale → text. Mapped to the wire
   *  `localizations` shape at upload time (step 3). */
  altText?: LocalizedText;
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

/** Bulk channel state across a selection: every file has it / some / none. */
export type ChannelState = 'on' | 'partial' | 'off';

interface UseUploadWizardReturnType {
  files: Ref<WizardFile[]>;
  settings: Ref<Record<string, WizardFileSettings>>;
  totalSize: ComputedRef<number>;
  addFiles: (list: FileList | File[] | null | undefined) => void;
  removeFiles: (ids: string[]) => void;
  clear: () => void;
  settingsOf: (id: string) => WizardFileSettings;
  patchSettings: (id: string, patch: Partial<WizardFileSettings>) => void;
  // Bulk operations across a set of checked ids (step 2 bulk pane).
  bulkFolderId: (ids: string[]) => string | null | undefined;
  setBulkFolder: (ids: string[], folderId: string | null) => void;
  channelState: (ids: string[], channel: string) => ChannelState;
  bulkChannelUnion: (ids: string[]) => string[];
  applyBulkChannels: (ids: string[], next: string[]) => void;
  bulkSharedTags: (ids: string[]) => string[];
  applyBulkTags: (ids: string[], next: string[]) => void;
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

  // ── Bulk operations across a checked selection ────────────────────────────
  // Reconciliation lives here, not the template: a shared value when every file
  // agrees, otherwise "mixed" (undefined); toggles apply to all in one pass.

  function bulkFolderId(ids: string[]): string | null | undefined {
    const [head] = ids;
    if (head === undefined) return undefined;
    const first = settingsOf(head).folderId ?? null;
    return ids.every((id) => (settingsOf(id).folderId ?? null) === first)
      ? first
      : undefined;
  }
  function setBulkFolder(ids: string[], folderId: string | null) {
    for (const id of ids) patchSettings(id, { folderId });
  }

  function channelState(ids: string[], channel: string): ChannelState {
    const n = ids.filter((id) =>
      (settingsOf(id).channels ?? []).includes(channel),
    ).length;
    return n === 0 ? 'off' : n === ids.length ? 'on' : 'partial';
  }
  // Union of channels across the selection — the chips the bulk selector shows;
  // a channel only some files have is "partial" (marked dashed in the UI).
  function bulkChannelUnion(ids: string[]): string[] {
    const set = new Set<string>();
    for (const id of ids)
      for (const c of settingsOf(id).channels ?? []) set.add(c);
    return [...set];
  }
  function applyBulkChannels(ids: string[], next: string[]) {
    // Added channels go on every file; removed ones come off every file.
    const union = bulkChannelUnion(ids);
    const added = next.filter((c) => !union.includes(c));
    const removed = new Set(union.filter((c) => !next.includes(c)));
    for (const id of ids) {
      const cur = (settingsOf(id).channels ?? []).filter(
        (c) => !removed.has(c),
      );
      patchSettings(id, {
        channels: [...cur, ...added.filter((c) => !cur.includes(c))],
      });
    }
  }

  function bulkSharedTags(ids: string[]): string[] {
    const [head] = ids;
    if (head === undefined) return [];
    const first = settingsOf(head).tags ?? [];
    return first.filter((tag) =>
      ids.every((id) => (settingsOf(id).tags ?? []).includes(tag)),
    );
  }
  function applyBulkTags(ids: string[], next: string[]) {
    // Diff against the shared set: added tags append to every file, removed
    // tags strip from every file — a file's non-shared tags are left intact.
    const shared = bulkSharedTags(ids);
    const added = next.filter((tag) => !shared.includes(tag));
    const removed = new Set(shared.filter((tag) => !next.includes(tag)));
    for (const id of ids) {
      const cur = (settingsOf(id).tags ?? []).filter(
        (tag) => !removed.has(tag),
      );
      patchSettings(id, {
        tags: [...cur, ...added.filter((tag) => !cur.includes(tag))],
      });
    }
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
    bulkFolderId,
    setBulkFolder,
    channelState,
    bulkChannelUnion,
    applyBulkChannels,
    bulkSharedTags,
    applyBulkTags,
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
