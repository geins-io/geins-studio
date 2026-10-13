# `LayoutBackgroundJobs`

`LayoutBackgroundJobs` is the background-jobs button and panel at the right end of [`LayoutHeader`](/components/layout/LayoutHeader). It also mounts `useBackgroundJobRunner`, which polls every pending job — see [`useBackgroundJobs`](/composables/useBackgroundJobs).

## Behaviour

- **Hidden until there's a job.** The button appears with the first job of the session and goes away once every finished job has been cleared.
- **Loading look.** While any job is pending, the icon is a blue spinning loader with a count badge in the primary colour. When all jobs are done, it turns into a green check.
- **Panel** (a `Popover`, aligned to the end). It follows the jobs prototype, with one row per job, newest first. Each row has a type icon box (move, replace or purge), the job's label, and a [`StatusBadge`](/components/StatusBadge) on the right:
  - **Pending:** a blue "In progress" badge, and under the label a small spinner with a muted activity line: the job's `activity`, or by kind "Moving…", "Replacing…" or "Deleting…". There's no progress bar: on QA a move reports its `movedCount` as 0 and then all within a second, and a purge's ids leave the trash in one pass, so a bar could only sit at 0 and then vanish.
  - **Completed:** a green "Done" badge. If a move skipped files, a "Partly done" badge and a line with the skipped count instead.
  - **Timeout:** a "Delayed" badge and "Still working in the background. Refresh later."
- **Finished rows stay about 2 minutes**, then leave on their own (not while the panel is open). **Clear finished** in the panel header drops them at once.
- The started toast's **View progress** action opens the panel through the shared `panelOpen` state.

## Usage

`LayoutHeader` renders it; there's nothing to place.

```vue
<div class="mr-2 ml-auto flex flex-shrink-0 items-center sm:mr-3">
  <LayoutBackgroundJobs />
</div>
```

## Dependencies

- [`useBackgroundJobs`](/composables/useBackgroundJobs), `useBackgroundJobRunner`
- shadcn-vue `Popover`, `Tooltip`, `Button`
