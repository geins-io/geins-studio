# `useAssetZipDownload`

`useAssetZipDownload` downloads a selection of assets as one `.zip`, built in the browser. It backs the asset library's bulk **Download** button.

One anchor per file doesn't work for a selection: browsers block or prompt for multiple downloads, and the `download` attribute is ignored cross-origin. Instead the composable fetches each file's bytes (the Geins CDN sends `Access-Control-Allow-Origin: *`, so no proxy is needed) and packs them with [fflate](https://github.com/101arrowz/fflate), which is imported lazily on the first download.

## Usage

```ts
const { downloading, downloadZip } = useAssetZipDownload();

// assets come from the page's id → Asset map, not a fetch
await downloadZip(selectedIds.value.flatMap((id) => knownAssets.get(id) ?? []));
```

```vue
<Button :disabled="downloading" @click="downloadSelected">
  {{ $t('download') }}
</Button>
```

## Behaviour

- **Size cap.** The summed `sizeBytes` must be at most `ASSET_ZIP_MAX_BYTES` (500 MB, `#shared/utils/asset`), since the zip is held in memory. Above it the composable refuses with a toast that states the limit and the selection's size, and fetches nothing.
- **Progress.** A toast with `duration: Infinity` shows "Preparing 12 of 40…" with a progress bar. Its **Cancel** action, close button and swipe all abort the run (`toast()` forwards the caller's `onOpenChange`). A cancelled run saves nothing and shows no further toast.
- **Fetching.** Four fetches at a time (`ZIP_CONCURRENCY`). Entries are stored, not deflated, since assets are mostly already-compressed media.
- **File names.** Flat zip, each entry named by the asset's `name`. Collisions get numbered before the extension, case-insensitively: `hero.jpg`, `hero (2).jpg`. The zip is saved as `assets-YYYY-MM-DD.zip` (local date).
- **Partial failure.** A file that fails to fetch, or an asset without a `url`, is skipped. The rest still download, then a warning toast says "N files couldn't be added to the zip". If nothing could be added, an error toast replaces the download.

## Returns

### `downloading`

```ts
downloading: Readonly<Ref<boolean>>;
```

True while a zip is being prepared. A second `downloadZip` call during a run is ignored.

### `downloadZip`

```ts
downloadZip: (assets: Asset[]) => Promise<void>;
```

Checks the cap, fetches and zips the assets, and saves the file. Resolves once the run finishes, fails or is cancelled.

### `cancel`

```ts
cancel: () => void;
```

Aborts the run in progress. The toast's Cancel already calls it.

## Utilities

The zip itself is built by pure helpers in `#shared/utils/zip`, tested without Nuxt:

- `buildZip(sources, { signal, concurrency, onProgress, fetch })` → `{ blob, added, failed }`. `blob` is `null` when nothing was added or the run was aborted.
- `uniqueFileNames(names)` — the collision numbering above.
- `zipFileName(prefix, date?)` — `{prefix}-YYYY-MM-DD.zip`.

The composable saves the blob through a same-origin object URL, where `download` is honoured.

## Dependencies

- `useToast` — progress, cap and result toasts
- [`useGeinsLog`](/composables/useGeinsLog) — logs each failed file
