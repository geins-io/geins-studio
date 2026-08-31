# `useUploadWizard`

`useUploadWizard` holds the working state for the multi-step asset upload wizard (`/asset-library/upload`): the selected files and the per-file metadata collected across steps.

It returns a **fresh instance per call**. The wizard page owns one instance and shares it with the step components through `provide` / `inject` (via `uploadWizardKey` / `useUploadWizardContext`), so the state resets automatically when the page unmounts.

## Why wrap files

A native `File` has no identity of its own, so the composable wraps each selected file as a `WizardFile { id, file }`, minting a stable `id` on add. That `id` keys the per-file `settings` map and the step-2 selection, and survives reordering and removal.

## Usage

```ts
// Upload page — owns the instance and shares it
const wizard = useUploadWizard();
provide(uploadWizardKey, wizard);
const { files, totalSize, addFiles, removeFiles } = wizard;
```

```ts
// Any step component — reads/writes the same instance
const { files, settingsOf, patchSettings } = useUploadWizardContext();
```

## Types

```ts
interface WizardFile {
  id: string;
  file: File;
}

interface WizardFileSettings {
  name?: string;
  folderId?: string | null;
  channels?: string[];
  description?: string;
  tags?: string[];
  altText?: LocalizedText;
}
```

## Returns

| Name                       | Type                                            | Description                                      |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `files`                    | `Ref<WizardFile[]>`                             | Selected files, each with a stable id.           |
| `settings`                 | `Ref<Record<string, WizardFileSettings>>`       | Per-file metadata, keyed by `WizardFile.id`.     |
| `totalSize`                | `ComputedRef<number>`                           | Sum of all file sizes (bytes).                   |
| `addFiles(list)`           | `(FileList \| File[]) => void`                  | Appends files, minting an id each.               |
| `removeFiles(ids)`         | `(string[]) => void`                            | Drops files and their settings by id.            |
| `clear()`                  | `() => void`                                    | Removes all files and settings.                  |
| `settingsOf(id)`           | `(string) => WizardFileSettings`                | Settings for one file (empty object if none).    |
| `patchSettings(id, patch)` | `(string, Partial<WizardFileSettings>) => void` | Merges a partial patch into one file's settings. |

## Bulk operations (step 2 bulk pane)

Operate on a set of checked ids; the reconciliation lives here, not in the template.

| Name                           | Type                                               | Description                                                                        |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `bulkFolderId(ids)`            | `(string[]) => string \| null \| undefined`        | Shared folder id, or `undefined` when the selection is mixed.                      |
| `setBulkFolder(ids, folderId)` | `(string[], string \| null) => void`               | Sets one folder on every file.                                                     |
| `channelState(ids, channel)`   | `(string[], string) => 'on' \| 'partial' \| 'off'` | Whether every / some / no file has the channel (drives the dashed partial marker). |
| `bulkChannelUnion(ids)`        | `(string[]) => string[]`                           | All channels present on any file — the chips the bulk selector shows.              |
| `applyBulkChannels(ids, next)` | `(string[], string[]) => void`                     | Added channels go on all files, removed come off all.                              |
| `bulkSharedTags(ids)`          | `(string[]) => string[]`                           | Tags common to every file.                                                         |
| `applyBulkTags(ids, next)`     | `(string[], string[]) => void`                     | Diffs against the shared set: added tags append to all, removed strip from all.    |

## Sharing helpers

- `uploadWizardKey` — the `InjectionKey` for the provided instance.
- `useUploadWizardContext()` — injects the instance; throws if used outside the wizard page.
