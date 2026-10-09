# Background jobs

Some media calls succeed at once but take effect later: a move copies files in the background, a purge deletes bytes about a minute after the call, and a replaced file takes a moment to reach the CDN. `settleJob` (`#shared/utils/job`) answers "is this job done yet?" for each of them, so a caller can show a job as pending and then done, instead of refetching once and hoping.

The engine is pure — no Vue, no Nuxt — and is unit-tested in node (`shared/utils/__tests__/job.test.ts`). The asset domain's [Async jobs](/domains/assets#async-jobs) table lists which call needs which check.

## Usage

```ts
const { assetApi } = useGeinsRepository();

const res = await assetApi.bulkMove(ids, folderId);
if (res) {
  const { state, result } = await settleJob(moveCheck(assetApi, res.moveId), {
    signal: controller.signal,
  });
  // state: 'completed' | 'timeout' | 'aborted'
  // result: the last MediaMove read (null once swept), for its skippedCount
}
```

`assetApi` satisfies every check's `api` argument structurally (`move` and `find`), so pass it as is.

## `settleJob(check, options?)`

```ts
settleJob<T>(
  check: () => Promise<JobCheck<T>>,
  options?: { signal?: AbortSignal; maxWaitMs?: number; schedule?: JobSchedule },
): Promise<JobOutcome<T>>;

interface JobCheck<T> { done: boolean; result?: T }
interface JobOutcome<T> { state: 'completed' | 'timeout' | 'aborted'; result?: T }
```

- **Backoff.** It waits before each check: 1s → 2s → 4s, then 5s each (`settleDelay`). The first check comes after the first wait, since the job was only just accepted.
- **Limit.** After `maxWaitMs` of waiting (default `SETTLE_MAX_WAIT_MS`, 2 minutes) it returns `timeout`. The backend retries a failing move without limit, so a move can stay `pending` forever; the caller decides what a timeout means to the user.
- **Errors.** A check that throws counts as "not done yet": it is logged and polling carries on until the limit.
- **Abort.** An aborted `signal` ends the current wait at once and returns `aborted`.
- **`result`** is the last result any check returned, also on `timeout` and `aborted`.
- **`schedule`** replaces the `setTimeout` wait — tests inject one that records the delays and returns at once.

Why not `usePollWhile`: it ticks on a fixed interval with no backoff and no limit, and it lives in a component's lifecycle. A job outlives the dialog that started it.

## Checks

Each factory returns a `check` for `settleJob`.

| Factory                                            | For                                                                    | Done when                                                                | `result`                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| `moveCheck(api, moveId)`                           | folder rename/move, relocate, bulk move, folder delete with `relocate` | `assetApi.move(moveId)` is `completed`, or `null` (404: swept after 24h) | `MediaMove \| null` — read `skippedCount` |
| `purgeCheck(api, assetIds)`                        | bulk purge, delete permanently                                         | none of the ids is left in the trash                                     | ids still trashed                         |
| `duePurgeCheck(api, now?)`                         | empty trash, folder delete with `purge`                                | no trashed asset has `purgeAfter` before now + 1h                        | —                                         |
| `replaceCheck(asset, sizeBytes, { fetch?, now? })` | replace file                                                           | a `HEAD` on the bare CDN URL returns the uploaded size                   | —                                         |

- **No `moveId`, no job.** A move call that started no copies (a `204` bulk move, an empty folder's rename, a relocate answered `200`) carries no `moveId`; don't settle it.
- **Why `purgeAfter`, not the call time.** Every purge sets `purgeAfter` to the server's now, while a fresh trash gets now + retention. Checking the earliest `purgeAfter` against a one-hour margin tells them apart without comparing the server's clock to the browser's. Assets expiring on their own go in the same reaper pass, so they only add seconds. This assumes retention is well over an hour (it's 30 days); a shorter one would hold the check until timeout.
- **Replace.** Pass the asset **before** the replace. The `HEAD` skips the browser cache and the `?v=` cache-buster (the bare URL is the one that can serve stale bytes). When the old and new sizes are equal, the CDN sends no `Content-Length`, or the `HEAD` isn't ok, size can't tell them apart, so the check waits `REPLACE_FALLBACK_MS` (10s) from its creation instead — best effort, done without the CDN confirming. A `HEAD` that throws counts as not done, like any check.
