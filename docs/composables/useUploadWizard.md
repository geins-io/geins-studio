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
  languages?: string[];
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

| Name                               | Type                                               | Description                                                                               |
| ---------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `bulkFolderId(ids)`                | `(string[]) => string \| null \| undefined`        | Shared folder id, or `undefined` when the selection is mixed.                             |
| `setBulkFolder(ids, folderId)`     | `(string[], string \| null) => void`               | Sets one folder on every file.                                                            |
| `channelState(ids, channel)`       | `(string[], string) => 'on' \| 'partial' \| 'off'` | Whether every / some / no file has the channel (drives the dashed partial marker).        |
| `bulkChannelUnion(ids)`            | `(string[]) => string[]`                           | All channels present on any file — the chips the bulk selector shows.                     |
| `applyBulkChannels(ids, next)`     | `(string[], string[]) => void`                     | Added channels go on all files, removed come off all.                                     |
| `bulkLanguages(ids)`               | `(string[]) => string[] \| undefined`              | Shared content languages (order-insensitive), or `undefined` when the selection is mixed. |
| `setBulkLanguages(ids, languages)` | `(string[], string[]) => void`                     | Replaces the content languages on every file.                                             |
| `bulkSharedTags(ids)`              | `(string[]) => string[]`                           | Tags common to every file.                                                                |
| `applyBulkTags(ids, next)`         | `(string[], string[]) => void`                     | Diffs against the shared set: added tags append to all, removed strip from all.           |

## Label limits

Tags, channels and content languages ride the upload ticket under the backend's `PATCH` rules, and a list over a limit gets that file rejected as `METADATA_INVALID`. These check the normalized values (`assetLabelLimitError`), so a case-only duplicate doesn't count.

| Name                         | Type                                                          | Description                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `labelLimitError(ids, kind)` | `(string[], AssetLabelKind) => AssetLabelLimitBreach \| null` | The first limit any of the files breaks for that list (`'count'` / `'length'`), or `null`.                                         |
| `hasLabelLimitError`         | `ComputedRef<boolean>`                                        | Whether any file breaks any limit. The upload page disables **Next** and the next step's header (step 2) and **Upload** while set. |

## Sharing helpers

- `uploadWizardKey` — the `InjectionKey` for the provided instance.
- `useUploadWizardContext()` — injects the instance; throws if used outside the wizard page.
