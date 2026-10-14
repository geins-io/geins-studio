<script setup lang="ts">
/**
 * Destination pane of a move: a warning that the URLs of the moved assets
 * change, then the folder tree as a destination picker. Used by the bulk "Move
 * to folder" action and, with `folder`, by `AssetFolderMoveDialog`.
 * The model is the tree selection — a folder id or `ROOT_FOLDER_KEY`
 * (Uncategorised); "All assets" and Trash aren't offered.
 */
const props = defineProps<{
  /** Moving a folder: the warning covers the assets inside it. */
  folder?: boolean;
  /** Selection keys that can't be picked (see `AssetFolderTree`). */
  disabledIds?: string[];
}>();

const destination = defineModel<string | null>({ default: null });
</script>

<template>
  <div class="flex flex-col gap-4">
    <Feedback type="warning">
      <template #title>
        {{
          $t(
            props.folder
              ? 'asset_library.folder_move_url_title'
              : 'asset_library.bulk_move_url_title',
          )
        }}
      </template>
      <template #description>
        {{
          $t(
            props.folder
              ? 'asset_library.folder_move_url_description'
              : 'asset_library.bulk_move_url_description',
          )
        }}
      </template>
    </Feedback>
    <SidebarProvider class="min-h-0! items-stretch">
      <Sidebar
        collapsible="none"
        class="h-auto w-full rounded-lg border bg-transparent!"
      >
        <AssetFolderTree
          v-model:selected="destination"
          readonly
          hide-all
          :disabled-ids="props.disabledIds"
        />
      </Sidebar>
    </SidebarProvider>
  </div>
</template>
