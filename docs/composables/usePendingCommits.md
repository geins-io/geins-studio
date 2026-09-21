# `usePendingCommits`

`usePendingCommits` connects a control that holds an **unconfirmed inline edit** to the host's primary action, so the edit is committed instead of silently dropped when the control unmounts.

The case it was built for: [`AssetFolderPicker`](/components/asset/AssetFolderPicker) keeps a typed new-folder name in local state until its own **Save** is clicked. Click **Upload** in the [`AssetUploadDialog`](/components/asset/AssetUploadDialog) with that input still open and the folder was never created — the files landed at the library root with no warning.

The host and the control find each other through `provide`/`inject`, not template refs, so wrapper components in between (the wizard's manage step, its bulk pane) need no plumbing of their own.

## Usage

Host — the component that owns the primary action:

```ts
const { hasPending, commitPending } = providePendingCommits();

async function upload() {
  // `false` = a commit failed; stop rather than act on a value the user never got.
  if (!(await commitPending())) return;
  // …read the now-committed values and run the action
}
```

Control — anywhere below that host:

```ts
registerPendingCommit({
  pending: () => creating.value && !!newFolderName.value.trim(),
  commit: createFolder, // async, resolves false when the save failed
});
```

In a panel, fold `hasPending` into the dirty flag so **Save** is reachable (and the close guard fires) when the inline edit is the only unsaved work:

```ts
const { isDirty, captureBaseline } = usePanelDirty(() => form.values);
const dirty = computed(() => isDirty.value || hasPending.value);
```

## `PendingEdit`

```ts
interface PendingEdit {
  pending: () => boolean;
  commit: () => Promise<boolean>;
}
```

`pending` must be reactive-readable (it is called inside a `computed`). `commit` resolves `false` when the save failed — the control keeps its input open so whatever explained the failure (usually the global error toast) sits next to it.

## Returns

### `hasPending`

```ts
hasPending: ComputedRef<boolean>;
```

True while any registered control holds an unconfirmed edit.

### `commitPending`

```ts
commitPending: () => Promise<boolean>;
```

Commits every pending control **sequentially** and resolves `false` at the first failure, leaving the rest untouched. Controls that aren't pending are skipped.

## Notes

- A control with no host above it still works — nothing registers.
- Controls unregister on unmount (`onScopeDispose`), so a step that swaps panes leaves nothing stale behind.
- Hosts: [`AssetUploadDialog`](/components/asset/AssetUploadDialog), [`AssetDetailPanel`](/components/asset/AssetDetailPanel), the upload wizard page (its **Next** button). Controls: [`AssetFolderPicker`](/components/asset/AssetFolderPicker).
