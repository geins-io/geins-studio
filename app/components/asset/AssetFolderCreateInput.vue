<script setup lang="ts">
// Inline new-folder name input. Enter commits (if non-empty), Esc/blur cancels.
const emit = defineEmits<{ create: [name: string]; cancel: [] }>();

const name = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => inputRef.value?.focus());

function commit() {
  const value = name.value.trim();
  if (value) emit('create', value);
  else emit('cancel');
}
</script>

<template>
  <SidebarMenuItem>
    <div class="px-2 py-1">
      <input
        ref="inputRef"
        v-model="name"
        :placeholder="$t('folder_name')"
        class="border-input bg-background focus-visible:ring-ring h-7 w-full rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="emit('cancel')"
        @blur="commit"
      />
    </div>
  </SidebarMenuItem>
</template>
