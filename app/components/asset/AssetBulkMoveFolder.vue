<script setup lang="ts">
/**
 * Properties pane of the bulk "Move to folder" action: a warning that every
 * moved asset's URL changes, then the folder tree as a destination picker.
 * The model is the tree selection — a folder id or `ROOT_FOLDER_KEY`
 * (Uncategorised); "All assets" and Trash aren't offered.
 */
const destination = defineModel<string | null>({ default: null });
</script>

<template>
  <div class="flex flex-col gap-4">
    <Feedback type="warning">
      <template #title>{{ $t('asset_library.bulk_move_url_title') }}</template>
      <template #description>
        {{ $t('asset_library.bulk_move_url_description') }}
      </template>
    </Feedback>
    <SidebarProvider class="min-h-0! items-stretch">
      <Sidebar
        collapsible="none"
        class="h-auto w-full rounded-lg border bg-transparent!"
      >
        <AssetFolderTree v-model:selected="destination" readonly hide-all />
      </Sidebar>
    </SidebarProvider>
  </div>
</template>
