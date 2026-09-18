import type { Folder } from '#shared/types';

/** A folder plus its nested children. */
export interface FolderNode extends Folder {
  children: FolderNode[];
}

export interface UseFoldersReturnType {
  folders: ComputedRef<Folder[]>;
  tree: ComputedRef<FolderNode[]>;
  folderName: (id?: string | null) => string | undefined;
  descendantIds: (rootId: string) => string[];
  loading: Ref<boolean>;
  error: Ref<unknown>;
  refresh: () => Promise<void>;
}

const FOLDERS_KEY = 'asset-folders';

function sortLevel(nodes: FolderNode[]): void {
  // `sortOrder` is mock-only (real phase 1 has no manual ordering), so absent
  // values collapse to a plain name sort.
  nodes.sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
  nodes.forEach((node) => sortLevel(node.children));
}

function buildTree(folders: Folder[]): FolderNode[] {
  const nodes = new Map<string, FolderNode>(
    folders.map((folder) => [folder._id, { ...folder, children: [] }]),
  );
  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentFolderId
      ? nodes.get(node.parentFolderId)
      : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  sortLevel(roots);
  return roots;
}

/**
 * Shared folder source for the Assets Library — one fetch (by the stable
 * `asset-folders` key) reused by the tree, cards, and pickers. Derives the
 * nested `tree` and resolves names by id. Folder filtering itself is
 * server-side; `descendantIds` is only a client mirror for UI needs.
 */
export function useFolders(): UseFoldersReturnType {
  const { assetApi } = useGeinsRepository();

  const { data, pending, error, refresh } = useAsyncData<Folder[]>(
    FOLDERS_KEY,
    () => assetApi.folder.list(),
    { default: () => [] },
  );

  // The mock's `system` rows (Uncategorised / Archived) are dropped outright:
  // real Geins.Media has no such folders, Uncategorised is a root query rather
  // than a row, and Archived has no counterpart at all. cutover: REMOVE@cutover
  // — the filter dies with the mock. Ledger: docs/domains/assets-cutover.md.
  const folders = computed<Folder[]>(() =>
    Array.isArray(data.value) ? data.value.filter((f) => !f.system) : [],
  );
  const tree = computed(() => buildTree(folders.value));

  const byId = computed(() => {
    const map = new Map<string, Folder>();
    for (const folder of folders.value) map.set(folder._id, folder);
    return map;
  });
  const folderName = (id?: string | null): string | undefined =>
    id ? byId.value.get(id)?.name : undefined;

  // Self + all descendants (mirrors the server's descendant resolution).
  const descendantIds = (rootId: string): string[] => {
    const childrenByParent = new Map<string | null, string[]>();
    for (const f of folders.value) {
      const siblings = childrenByParent.get(f.parentFolderId) ?? [];
      siblings.push(f._id);
      childrenByParent.set(f.parentFolderId, siblings);
    }
    const out: string[] = [];
    const stack = [rootId];
    while (stack.length) {
      const id = stack.pop() as string;
      out.push(id);
      for (const child of childrenByParent.get(id) ?? []) stack.push(child);
    }
    return out;
  };

  return {
    folders,
    tree,
    folderName,
    descendantIds,
    loading: pending,
    error,
    refresh,
  };
}
