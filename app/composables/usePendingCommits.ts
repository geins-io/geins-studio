import type { ComputedRef, InjectionKey } from 'vue';

/**
 * An edit a control holds locally until the user confirms it — e.g. the typed
 * but never-saved folder name in `AssetFolderPicker`. `commit` saves it and
 * resolves `false` when that save failed, so the host stops instead of acting
 * on a value the user never got.
 */
export interface PendingEdit {
  /** True while the control is holding an unconfirmed edit. */
  pending: () => boolean;
  /** Save it. `false` = it failed; the host aborts. */
  commit: () => Promise<boolean>;
}

export interface UsePendingCommitsReturnType {
  /** True while any registered control holds an unconfirmed edit. */
  hasPending: ComputedRef<boolean>;
  /** Commit them all; `false` when one failed, so the caller returns early. */
  commitPending: () => Promise<boolean>;
}

const pendingCommitsKey: InjectionKey<(edit: PendingEdit) => void> =
  Symbol('pendingCommits');

/**
 * Host side of the pending-edit registry: a primary action (Upload, Save,
 * Next) awaits `commitPending()` first, so an inline edit the user typed but
 * never confirmed is saved instead of dropped with the control that held it.
 *
 * Call this in the component that owns the action; controls anywhere below it
 * register themselves with {@link registerPendingCommit}, so the two don't need
 * template refs to find each other through wrapper components.
 */
export function providePendingCommits(): UsePendingCommitsReturnType {
  // shallowRef: a deep ref would hand back reactive proxies, and the identity
  // check on unregister would then never match the raw object registered.
  const edits = shallowRef<PendingEdit[]>([]);

  provide(pendingCommitsKey, (edit) => {
    edits.value = [...edits.value, edit];
    // Registration runs in the control's setup, so this is its own scope.
    onScopeDispose(() => {
      edits.value = edits.value.filter((registered) => registered !== edit);
    });
  });

  const hasPending = computed(() => edits.value.some((edit) => edit.pending()));

  async function commitPending(): Promise<boolean> {
    // Sequential, and the first failure stops the rest — the host aborts with
    // the failed edit still on screen next to whatever explained the failure.
    for (const edit of edits.value) {
      if (edit.pending() && !(await edit.commit())) return false;
    }
    return true;
  }

  return { hasPending, commitPending };
}

/**
 * Control side: hand the nearest host the edit this control is holding. With
 * no host above it the control still works — nothing registers.
 */
export function registerPendingCommit(edit: PendingEdit): void {
  inject(pendingCommitsKey, null)?.(edit);
}
