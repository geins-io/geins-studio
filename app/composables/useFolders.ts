import type { Folder } from '#shared/types';

/** A folder plus its nested children (user folders only). */
export interface FolderNode extends Folder {
  children: FolderNode[];
}

export interface UseFoldersReturnType {
  folders: ComputedRef<Folder[]>;
  userFolders: ComputedRef<Folder[]>;
  systemFolders: ComputedRef<Folder[]>;
  tree: ComputedRef<FolderNode[]>;
  folderName: (id?: string | null) => string | undefined;
  descendantIds: (rootId: string) => string[];
  loading: Ref<boolean>;
  error: Ref<unknown>;
  refresh: () => Promise<void>;
}

const FOLDERS_KEY = 'asset-folders';

function sortLevel(nodes: FolderNode[]): void {
  nodes.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
  nodes.forEach((node) => sortLevel(node.children));
}

function buildTree(folders: Folder[]): FolderNode[] {
  const nodes = new Map<string, FolderNode>(
    folders.map((folder) => [folder._id, { ...folder, children: [] }]),
  );
  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  sortLevel(roots);
  return roots;
}

/**
 * Shared folder source for the Assets Library — one fetch (by the stable
 * `asset-folders` key) reused by the tree, cards, and pickers. Derives the
 * nested `tree` (user folders), splits system vs user, and resolves names by
 * id. Folder filtering itself is server-side; `descendantIds` is only a
 * client mirror for UI needs.
 */
export function useFolders(): UseFoldersReturnType {
  const { assetApi } = useGeinsRepository();

  const { data, pending, error, refresh } = useAsyncData<Folder[]>(
    FOLDERS_KEY,
    () => assetApi.folder.list(),
    { default: () => [] },
  );

  const folders = computed<Folder[]>(() =>
    Array.isArray(data.value) ? data.value : [],
  );
  const userFolders = computed(() => folders.value.filter((f) => !f.system));
  const systemFolders = computed(() => folders.value.filter((f) => f.system));
  const tree = computed(() => buildTree(userFolders.value));

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
      const siblings = childrenByParent.get(f.parentId) ?? [];
      siblings.push(f._id);
      childrenByParent.set(f.parentId, siblings);
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
    userFolders,
    systemFolders,
    tree,
    folderName,
    descendantIds,
    loading: pending,
    error,
    refresh,
  };
}
