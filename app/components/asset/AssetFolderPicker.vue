<script setup lang="ts">
/**
 * Folder selector with inline "create new" — the shared control used wherever an
 * asset's folder is chosen (upload dialog, detail panel, upload wizard). Picks
 * from {@link useFolders}; the "new" button swaps the select for a name input
 * that creates the folder via `assetApi.folder.create`, then selects it.
 *
 * `v-model` is the folder id (`string`) or `null` for uncategorised.
 *
 * A name typed into that input but never saved is registered with the nearest
 * {@link providePendingCommits} host, so the host's primary action creates it
 * first instead of dropping it.
 */
withDefaults(
  defineProps<{
    /** Select placeholder when nothing is chosen (e.g. bulk "multiple folders"). */
    placeholder?: string;
  }>(),
  { placeholder: '' },
);

// `null` = uncategorised; `undefined` = no explicit value (bulk "mixed"), which
// selects nothing so the placeholder shows.
const model = defineModel<string | null | undefined>({ default: null });

const { assetApi } = useGeinsRepository();
const { folders, refresh: refreshFolders } = useFolders();
const { geinsLogError } = useGeinsLog('components/AssetFolderPicker.vue');

// Select needs a string value, so map null ↔ a sentinel (and mixed ↔ '').
const NO_FOLDER = '__none__';
const selectValue = computed(() =>
  model.value === undefined ? '' : (model.value ?? NO_FOLDER),
);

const creating = ref(false);
const newFolderName = ref('');

function cancelCreate() {
  creating.value = false;
  newFolderName.value = '';
}

/** @returns `false` when the create failed, so a host action stops there. */
async function createFolder(): Promise<boolean> {
  const name = newFolderName.value.trim();
  if (!name) {
    creating.value = false;
    return true;
  }
  try {
    const folder = await assetApi.folder.create({
      name,
      parentFolderId: null,
    });
    await refreshFolders();
    model.value = folder._id;
  } catch (error) {
    // Leave the input open with the name intact: the global error toast says
    // why, and the host stops rather than quietly falling back to no folder.
    geinsLogError('createFolder', getErrorMessage(error));
    return false;
  }
  creating.value = false;
  newFolderName.value = '';
  return true;
}

// A host's primary action (upload, save, next) commits a typed-but-unsaved
// name before it runs, so the folder isn't lost when this control unmounts.
registerPendingCommit({
  pending: () => creating.value && !!newFolderName.value.trim(),
  commit: createFolder,
});
</script>

<template>
  <div v-if="creating" class="flex gap-2">
    <Input
      v-model="newFolderName"
      class="flex-1"
      :placeholder="$t('asset_library.folder_name')"
      @keydown.enter.prevent="createFolder"
      @keydown.esc.prevent="cancelCreate"
    />
    <Button variant="secondary" size="lg" @click="createFolder">
      {{ $t('save') }}
    </Button>
    <Button variant="ghost" size="lg" @click="cancelCreate">
      {{ $t('cancel') }}
    </Button>
  </div>
  <div v-else class="flex gap-2">
    <Select
      :model-value="selectValue"
      @update:model-value="
        (v) => (model = v === NO_FOLDER ? null : (v as string))
      "
    >
      <SelectTrigger class="flex-1">
        <SelectValue
          :placeholder="placeholder || $t('asset_library.no_folder')"
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem :value="NO_FOLDER">
          {{ $t('asset_library.no_folder') }}
        </SelectItem>
        <SelectItem
          v-for="folder in folders"
          :key="folder._id"
          :value="folder._id"
        >
          {{ folder.name }}
        </SelectItem>
      </SelectContent>
    </Select>
    <ButtonIcon icon="new" variant="outline" size="lg" @click="creating = true">
      {{ $t('new') }}
    </ButtonIcon>
  </div>
</template>
