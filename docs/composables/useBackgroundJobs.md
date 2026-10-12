# `useBackgroundJobs`

`useBackgroundJobs` starts and reads **background jobs**: media calls that succeed at once but land later, like a replaced file reaching the CDN or a bulk move's copies. Starting a job swaps the caller's success toast for a neutral "started" toast. Its **View progress** action opens the jobs panel in the header ([`LayoutBackgroundJobs`](/components/layout/LayoutBackgroundJobs)). The success toast comes later, when the job has actually landed.

The polling engine and the checks are pure functions in `#shared/utils/job` — see [Background jobs](/concepts/background-jobs).

## Usage

```ts
const backgroundJobs = useBackgroundJobs();

backgroundJobs.start({
  spec: { kind: 'move', moveIds },
  label: { key: 'asset_library.job_moving', params: { count }, plural: count },
  doneMessage: {
    key: 'asset_library.bulk_moved_to_folder',
    params: { count },
    plural: count,
  },
  refreshKeys: ['asset-library-list'],
});
```

A bulk action starts its job through `BulkAction.startJob(count, responses)`. When that returns `true`, [`useBulkRunner`](/composables/useBulkRunner) skips its own success toast, as the move-to-folder action in the asset library does.

## Job shape

A job is plain JSON (`BackgroundJobStart` in `#shared/types`), so it survives a reload:

- **`spec`**: what to poll. `{ kind: 'move', moveIds }` (one per 100-id chunk) or `{ kind: 'replace', url, etagBefore }` (`etagBefore` from `cdnEtag(url)`, read before the replace call). `backgroundJobCheck(spec, assetApi)` rebuilds the check from it.
- **`label`**: the panel row and the started toast, kept as an i18n key + params (`JobMessage`), so a resumed job renders in the current locale.
- **`doneMessage`**: the success toast once the job lands. Reuse the action's existing success key.
- **`refreshKeys`**: `useAsyncData` keys refreshed once the job lands. Only mounted reads refetch, so the page the user is on updates and other pages don't fetch.

## Returns

| Name            | Type                                         | Description                                     |
| --------------- | -------------------------------------------- | ----------------------------------------------- |
| `jobs`          | `Ref<BackgroundJob[]>`                       | Every job this session, oldest first            |
| `pending`       | `ComputedRef<BackgroundJob[]>`               | Jobs still running                              |
| `hasFinished`   | `ComputedRef<boolean>`                       | Any completed or timed-out job left in the list |
| `panelOpen`     | `Ref<boolean>`                               | The header panel's open state                   |
| `start`         | `(job: BackgroundJobStart) => BackgroundJob` | Track a job and toast that it started           |
| `message`       | `(msg: JobMessage) => string`                | Translate a stored message                      |
| `clearFinished` | `() => void`                                 | Drop finished jobs from the panel               |

## Running and persistence

`useBackgroundJobRunner()` does the polling. [`LayoutBackgroundJobs`](/components/layout/LayoutBackgroundJobs) mounts it once in the header, so a job outlives the dialog that started it. For each pending job it runs `settleJob` with the rebuilt check, storing progress as it goes. When the job settles:

- **Completed:** a replace marks its file as replaced (`markFileReplaced`, read back by `fileVersion(url)`) so previews bust the CDN and browser cache; then refresh `refreshKeys`, then toast `doneMessage` (`positive`). If a move skipped files, the toast is a `warning` with "N files weren't moved because they changed during the move".
- **Timeout** (about 2 minutes): refresh anyway and show a `warning` toast: "Still working in the background. Refresh later."
- **Failed** has no state of its own. A job only starts after its request succeeded, and the global API error toast stays the owner of request errors.

The `useBackgroundJobsStore` Pinia store keeps pending jobs in `localStorage` under `geins-background-jobs:{accountKey}`, so a reload or a second tab resumes them. A pending job older than 15 minutes (`BACKGROUND_JOB_RESUME_MS`) isn't resumed. Finished jobs are in memory only, and leave the panel 2 minutes after they finish (`BACKGROUND_JOB_KEEP_MS`) — never while the panel is open. On an account switch the runner aborts its polls and loads the new account's jobs. If storage is blocked, jobs still run; they just don't survive a reload.

A few limits to be aware of:

- **Several tabs.** A write keeps the stored pending jobs of other tabs, matched by id, so tabs don't drop each other's jobs. A job restored in two tabs is polled, and toasts, in both.
- **Resumed jobs** count from the job's own `startedAt`. They get whatever is left of the 2-minute limit, with at least one check, and replace's fallback timer doesn't restart.
- **Header only.** The runner lives in the header (`LayoutBackgroundJobs`), so a layout without the header doesn't poll jobs.
- **Preview versions** (`fileVersion`) are in memory only. After a reload, the browser decides whether a cached preview is still fresh.
- **Replace reads the CDN's `ETag`.** That header isn't CORS-safelisted; the CDN exposes it (verified on QA). Without it, replace falls back to the 10s timer. `cdnEtag` gives up after 3s, so a hung `HEAD` can't hold the dialog.
