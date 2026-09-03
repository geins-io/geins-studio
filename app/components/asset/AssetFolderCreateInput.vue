<script setup lang="ts">
// Inline new-folder name input. Enter/blur commits (if non-empty), Esc cancels.
const emit = defineEmits<{ create: [name: string]; cancel: [] }>();

const name = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => inputRef.value?.focus());

// Committing hides this input (parent sets `addingTop`/`addingChild` false),
// which unmounts it and fires @blur → a second commit. Guard so exactly one
// create/cancel is emitted, otherwise Enter creates the folder twice.
const done = ref(false);
function finish(action: 'create' | 'cancel') {
  if (done.value) return;
  done.value = true;
  const value = name.value.trim();
  if (action === 'create' && value) emit('create', value);
  else emit('cancel');
}
</script>

<template>
  <SidebarMenuItem>
    <div class="px-2 py-1">
      <input
        ref="inputRef"
        v-model="name"
        :placeholder="$t('asset_library.folder_name')"
        class="border-input bg-background focus-visible:ring-ring h-7 w-full rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
        @keydown.enter.prevent="finish('create')"
        @keydown.esc.prevent="finish('cancel')"
        @blur="finish('create')"
      />
    </div>
  </SidebarMenuItem>
</template>
